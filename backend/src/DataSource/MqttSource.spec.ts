import * as net from 'net'
import { expect } from 'chai'
import { MqttSource } from './MqttSource'

const CONNACK_V3_ACCEPTED = Buffer.from([0x20, 0x02, 0x00, 0x00])
const CONNACK_V5_ACCEPTED = Buffer.from([0x20, 0x03, 0x00, 0x00, 0x00])
const CONNACK_UNACCEPTABLE_PROTOCOL_VERSION = Buffer.from([0x20, 0x02, 0x00, 0x01])

/**
 * Minimal broker that only answers CONNECT, recording the protocol level of
 * every attempt so a test can assert which versions were tried, in which order.
 */
function startBroker(version5Behaviour: 'accept' | 'refuse' | 'hangUp') {
  const protocolLevels: Array<number> = []
  const sockets: Array<net.Socket> = []
  const server = net.createServer(socket => {
    sockets.push(socket)
    socket.on('error', () => undefined)
    socket.on('data', data => {
      const isConnect = data[0] >> 4 === 1
      if (!isConnect) {
        return
      }
      const level = data[data.indexOf('MQTT') + 4]
      protocolLevels.push(level)
      if (level !== 5) {
        socket.write(CONNACK_V3_ACCEPTED)
      } else if (version5Behaviour === 'accept') {
        socket.write(CONNACK_V5_ACCEPTED)
      } else if (version5Behaviour === 'refuse') {
        socket.write(CONNACK_UNACCEPTABLE_PROTOCOL_VERSION)
      } else {
        socket.destroy() // allowed by MQTT-3.1.4-1: hang up instead of answering
      }
    })
  })

  return new Promise<{ port: number; protocolLevels: Array<number>; stop: () => Promise<void> }>(resolve => {
    server.listen(0, '127.0.0.1', () =>
      resolve({
        port: (server.address() as net.AddressInfo).port,
        protocolLevels,
        stop: () =>
          new Promise<void>(done => {
            sockets.forEach(socket => socket.destroy())
            server.close(() => done())
          }),
      })
    )
  })
}

function connectSource(source: MqttSource, port: number, protocolVersion?: 3 | 4 | 5) {
  const stateMachine = source.connect({
    url: `mqtt://127.0.0.1:${port}`,
    tls: false,
    certValidation: false,
    subscriptions: [],
    protocolVersion,
  })

  return new Promise<{ connected: boolean; error?: string }>(resolve => {
    const timer = setTimeout(() => resolve({ connected: false, error: 'timeout' }), 4000)
    stateMachine.onUpdate.subscribe(state => {
      if (state.connected || state.error) {
        clearTimeout(timer)
        resolve({ connected: state.connected, error: state.error })
      }
    })
  })
}

describe('MqttSource protocol version negotiation', () => {
  let source: MqttSource

  beforeEach(() => {
    source = new MqttSource()
  })

  afterEach(() => {
    source.disconnect()
  })

  it('uses v5 when no version is configured and the broker supports it', async () => {
    const broker = await startBroker('accept')
    const result = await connectSource(source, broker.port)

    expect(result.connected).to.equal(true)
    expect(broker.protocolLevels).to.deep.equal([5])
    expect(source.protocolVersion).to.equal(5)
    await broker.stop()
  })

  it('falls back to v3.1.1 when the broker rejects v5', async () => {
    const broker = await startBroker('refuse')
    const result = await connectSource(source, broker.port)

    expect(result.connected).to.equal(true)
    expect(result.error).to.equal(undefined)
    expect(broker.protocolLevels).to.deep.equal([5, 4])
    expect(source.protocolVersion).to.equal(4)
    await broker.stop()
  })

  it('falls back to v3.1.1 when the broker hangs up on v5 instead of answering', async () => {
    const broker = await startBroker('hangUp')
    const result = await connectSource(source, broker.port)

    expect(result.connected).to.equal(true)
    expect(broker.protocolLevels).to.deep.equal([5, 4])
    expect(source.protocolVersion).to.equal(4)
    await broker.stop()
  })

  it('does not downgrade an explicitly configured version', async () => {
    const broker = await startBroker('refuse')
    const result = await connectSource(source, broker.port, 5)

    expect(result.connected).to.equal(false)
    expect(result.error).to.contain('protocol version')
    expect(broker.protocolLevels).to.deep.equal([5])
    await broker.stop()
  })
})

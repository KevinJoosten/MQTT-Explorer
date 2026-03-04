import { expect } from 'chai'
import 'mocha'
import { toMqttConnection, createEmptyConnection, ConnectionOptions } from '../ConnectionOptions'

function makeConnection(overrides: Partial<ConnectionOptions> = {}): ConnectionOptions {
  return {
    configVersion: 1,
    type: 'mqtt',
    id: 'test-id',
    host: 'broker.example.com',
    protocol: 'mqtt',
    port: 1883,
    name: 'Test Connection',
    encryption: false,
    certValidation: true,
    subscriptions: [{ topic: '#', qos: 0 }],
    ...overrides,
  }
}

describe('ConnectionOptions', () => {
  describe('toMqttConnection', () => {
    describe('protocolVersion', () => {
      it('should pass protocolVersion 5 (MQTT v5) to MqttOptions', () => {
        const connection = makeConnection({ protocolVersion: 5 })
        const result = toMqttConnection(connection)
        expect(result).to.exist
        expect(result!.protocolVersion).to.equal(5)
      })

      it('should pass protocolVersion 4 (MQTT v3.1.1) to MqttOptions', () => {
        const connection = makeConnection({ protocolVersion: 4 })
        const result = toMqttConnection(connection)
        expect(result!.protocolVersion).to.equal(4)
      })

      it('should pass protocolVersion 3 (MQTT v3.1) to MqttOptions', () => {
        const connection = makeConnection({ protocolVersion: 3 })
        const result = toMqttConnection(connection)
        expect(result!.protocolVersion).to.equal(3)
      })

      it('should pass undefined protocolVersion for auto-negotiation when not set', () => {
        const connection = makeConnection()
        const result = toMqttConnection(connection)
        expect(result!.protocolVersion).to.be.undefined
      })
    })

    it('should return undefined for non-mqtt connection type', () => {
      const connection = makeConnection({ type: 'other' as any })
      expect(toMqttConnection(connection)).to.be.undefined
    })

    it('should construct the correct url from protocol, host and port', () => {
      const connection = makeConnection({ protocol: 'mqtt', host: 'broker.test.org', port: 1883 })
      const result = toMqttConnection(connection)
      expect(result!.url).to.include('broker.test.org')
      expect(result!.url).to.include('1883')
    })
  })

  describe('createEmptyConnection', () => {
    it('should not set a protocolVersion (defaults to auto)', () => {
      const conn = createEmptyConnection()
      expect(conn.protocolVersion).to.be.undefined
    })

    it('should have valid default subscriptions', () => {
      const conn = createEmptyConnection()
      const topics = conn.subscriptions.map((s) => s.topic)
      expect(topics).to.include('#')
      expect(topics).to.include('$SYS/#')
    })
  })
})

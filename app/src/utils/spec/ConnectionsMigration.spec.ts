import 'mocha'
import { expect } from 'chai'
import { connectionsMigrator } from '../../actions/migrations/Connection'

describe('ConnectionsMigrator', () => {
  it('applies migrations', () => {
    let connections: any = {
      '763b2e5c-c1ed-4c9b-ac9a-0970b3be29a7': {
        certValidation: true,
        clientId: 'mqtt-explorer-2783f48c',
        encryption: false,
        host: 'nodered',
        id: '763b2e5c-c1ed-4c9b-ac9a-0970b3be29a7',
        name: 'nodered',
        port: 1883,
        protocol: 'mqtt',
        subscriptions: ['#', '$SYS/#'],
        type: 'mqtt',
      },
      'iot.eclipse.org': {
        certValidation: true,
        clientId: 'mqtt-explorer-d913aad3',
        encryption: false,
        host: 'iot.eclipse.org',
        id: 'iot.eclipse.org',
        name: 'iot.eclipse.org',
        port: 1883,
        protocol: 'mqtt',
        subscriptions: ['#', '$SYS/#'],
        type: 'mqtt',
      },
    }

    const result = connectionsMigrator.applyMigrations(connections)

    // Check first connection
    expect(result['763b2e5c-c1ed-4c9b-ac9a-0970b3be29a7'].configVersion).to.eq(2)
    expect(result['763b2e5c-c1ed-4c9b-ac9a-0970b3be29a7'].certValidation).to.eq(true)
    expect(result['763b2e5c-c1ed-4c9b-ac9a-0970b3be29a7'].clientId).to.eq(undefined)
    expect(result['763b2e5c-c1ed-4c9b-ac9a-0970b3be29a7'].host).to.eq('nodered')
    expect(result['763b2e5c-c1ed-4c9b-ac9a-0970b3be29a7'].folder).to.eq(undefined)
    expect(result['763b2e5c-c1ed-4c9b-ac9a-0970b3be29a7'].createdAt).to.be.a('number')
    expect(result['763b2e5c-c1ed-4c9b-ac9a-0970b3be29a7'].subscriptions).to.deep.eq([
      { topic: '#', qos: 0 },
      { topic: '$SYS/#', qos: 0 },
    ])

    // Check second connection (migrated from iot.eclipse.org to mqtt.eclipse.org)
    expect(result['mqtt.eclipse.org'].configVersion).to.eq(2)
    expect(result['mqtt.eclipse.org'].certValidation).to.eq(true)
    expect(result['mqtt.eclipse.org'].clientId).to.eq(undefined)
    expect(result['mqtt.eclipse.org'].host).to.eq('mqtt.eclipse.org')
    expect(result['mqtt.eclipse.org'].folder).to.eq(undefined)
    expect(result['mqtt.eclipse.org'].createdAt).to.be.a('number')
    expect(result['mqtt.eclipse.org'].subscriptions).to.deep.eq([
      { topic: '#', qos: 0 },
      { topic: '$SYS/#', qos: 0 },
    ])
  })
})

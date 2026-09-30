import { expect } from 'chai'
import { describe, it } from 'mocha'
import { rootLabel } from './rootLabel'

describe('rootLabel', () => {
  it('shows the host alone while the setting is off', () => {
    expect(rootLabel('192.168.1.50', 'Production Broker', false)).to.equal('192.168.1.50')
  })

  it('appends the stored connection name when the setting is on', () => {
    expect(rootLabel('192.168.1.50', 'Production Broker', true)).to.equal('192.168.1.50 (Production Broker)')
  })

  it('stays quiet when the connection has no name', () => {
    expect(rootLabel('192.168.1.50', undefined, true)).to.equal('192.168.1.50')
    expect(rootLabel('192.168.1.50', '   ', true)).to.equal('192.168.1.50')
  })

  it('does not repeat a name that is just the host', () => {
    // The shipped default profiles are named after their host
    expect(rootLabel('test.mosquitto.org', 'test.mosquitto.org', true)).to.equal('test.mosquitto.org')
    expect(rootLabel('test.mosquitto.org', ' Test.Mosquitto.ORG ', true)).to.equal('test.mosquitto.org')
  })

  it('passes an unknown host through untouched', () => {
    expect(rootLabel(undefined, 'Production Broker', true)).to.equal(undefined)
  })
})

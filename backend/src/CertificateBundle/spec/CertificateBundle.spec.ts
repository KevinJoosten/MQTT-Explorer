import 'mocha'
import { expect } from 'chai'
import { mapCertificateBundle, BundleEntry } from '../CertificateBundle'

function cert(body: string): Buffer {
  return Buffer.from(`-----BEGIN CERTIFICATE-----\n${body}\n-----END CERTIFICATE-----\n`)
}
function key(body: string): Buffer {
  return Buffer.from(`-----BEGIN EC PRIVATE KEY-----\n${body}\n-----END EC PRIVATE KEY-----\n`)
}

describe('mapCertificateBundle', () => {
  it('maps ca / client cert / client key by filename and content', () => {
    const entries: BundleEntry[] = [
      { name: 'ca.crt', content: cert('CA') },
      { name: 'client.crt', content: cert('CLIENT') },
      { name: 'client.key', content: key('KEY') },
    ]

    const result = mapCertificateBundle(entries)

    expect(result.selfSignedCertificate).to.not.equal(undefined)
    expect(result.selfSignedCertificate!.name).to.equal('ca.crt')
    expect(result.clientCertificate!.name).to.equal('client.crt')
    expect(result.clientKey!.name).to.equal('client.key')
  })

  it('stores data as base64 of the file bytes', () => {
    const caContent = cert('CA')
    const result = mapCertificateBundle([{ name: 'ca.crt', content: caContent }])
    expect(result.selfSignedCertificate!.data).to.equal(caContent.toString('base64'))
  })

  it('detects the key by PEM header even without a .key extension', () => {
    const result = mapCertificateBundle([{ name: 'private.pem', content: key('KEY') }])
    expect(result.clientKey!.name).to.equal('private.pem')
    expect(result.clientCertificate).to.equal(undefined)
  })

  it('ignores directory entries and empty files', () => {
    const entries: BundleEntry[] = [
      { name: 'certs/', content: Buffer.alloc(0) },
      { name: 'ca.crt', content: cert('CA') },
    ]
    const result = mapCertificateBundle(entries)
    expect(result.selfSignedCertificate!.name).to.equal('ca.crt')
  })

  it('treats a lone non-CA-named certificate as the client certificate', () => {
    const result = mapCertificateBundle([{ name: 'edge-user.crt', content: cert('CLIENT') }])
    expect(result.clientCertificate!.name).to.equal('edge-user.crt')
    expect(result.selfSignedCertificate).to.equal(undefined)
  })

  it('disambiguates two non-CA-looking certs by the "ca" filename token', () => {
    const entries: BundleEntry[] = [
      { name: 'server-ca.crt', content: cert('CA') },
      { name: 'edge-user.crt', content: cert('CLIENT') },
    ]
    const result = mapCertificateBundle(entries)
    expect(result.selfSignedCertificate!.name).to.equal('server-ca.crt')
    expect(result.clientCertificate!.name).to.equal('edge-user.crt')
  })
})

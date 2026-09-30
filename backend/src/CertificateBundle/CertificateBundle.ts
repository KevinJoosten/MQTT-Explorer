import * as crypto from 'crypto'

/**
 * A single file extracted from a certificate bundle (zip).
 */
export interface BundleEntry {
  name: string
  content: Buffer
}

/**
 * A certificate/key ready to be stored on a connection. `data` is base64 encoded,
 * matching the format produced by the individual certificate selection flow.
 */
export interface CertificateField {
  name: string
  data: string
}

/**
 * The result of mapping a bundle's files onto the three connection cert slots.
 * Only slots that could be resolved are populated.
 */
export interface MappedCertificateBundle {
  selfSignedCertificate?: CertificateField
  clientCertificate?: CertificateField
  clientKey?: CertificateField
}

const CERTIFICATE_MARKER = '-----BEGIN CERTIFICATE-----'

function basename(name: string): string {
  const parts = name.split(/[\\/]/)
  return parts[parts.length - 1]
}

function stripExtension(name: string): string {
  return basename(name).replace(/\.[^.]+$/, '')
}

function isPrivateKey(entry: BundleEntry): boolean {
  const text = entry.content.toString('latin1')
  return /-----BEGIN [^-]*PRIVATE KEY-----/i.test(text) || /\.key$/i.test(basename(entry.name))
}

function isCertificate(entry: BundleEntry): boolean {
  const text = entry.content.toString('latin1')
  return text.includes(CERTIFICATE_MARKER) || /\.(crt|cer|pem)$/i.test(basename(entry.name))
}

/**
 * Filename heuristic: a base name of "ca" or one containing a standalone "ca" token
 * (ca.crt, my-ca.pem, ca_cert.crt, rootca.crt) marks a CA certificate.
 */
function nameLooksLikeCa(entry: BundleEntry): boolean {
  const base = stripExtension(entry.name).toLowerCase()
  return base === 'ca' || /(^|[^a-z])ca([^a-z]|$)/.test(base) || base.endsWith('ca')
}

/**
 * Robust CA detection: prefer the X.509 basic-constraints flag, treat a self-signed
 * certificate (issuer === subject) as a CA candidate, and fall back to the filename.
 */
function certificateIsCa(entry: BundleEntry): boolean {
  try {
    const X509 = (crypto as any).X509Certificate
    if (X509) {
      const cert = new X509(entry.content)
      if (cert.ca === true) {
        return true
      }
      if (cert.issuer && cert.subject && cert.issuer === cert.subject) {
        return true
      }
      // Parsed successfully and is clearly not a CA — trust that over the filename.
      return false
    }
  } catch {
    // Not parseable as X.509 — fall back to the filename heuristic below.
  }
  return nameLooksLikeCa(entry)
}

function toField(entry: BundleEntry): CertificateField {
  return { name: basename(entry.name), data: entry.content.toString('base64') }
}

/**
 * Maps the files of a certificate bundle onto the CA / client-cert / client-key slots.
 *
 * Assumptions (documented for the reviewer): a bundle contains at most one private key
 * and one or two certificates. The CA is identified by its X.509 basic-constraints flag
 * when parseable, otherwise by filename. When two certificates are present but neither is
 * a clear CA, the one whose name contains "ca" wins and the other becomes the client cert.
 */
export function mapCertificateBundle(entries: BundleEntry[]): MappedCertificateBundle {
  const files = entries.filter(e => e.content && e.content.length > 0 && !e.name.endsWith('/'))
  const keys = files.filter(isPrivateKey)
  const certs = files.filter(e => !isPrivateKey(e) && isCertificate(e))

  const result: MappedCertificateBundle = {}

  if (keys.length > 0) {
    result.clientKey = toField(keys[0])
  }

  if (certs.length === 0) {
    return result
  }

  let caCert: BundleEntry | undefined
  let clientCert: BundleEntry | undefined

  if (certs.length === 1) {
    if (certificateIsCa(certs[0])) {
      caCert = certs[0]
    } else {
      clientCert = certs[0]
    }
  } else {
    const caCerts = certs.filter(certificateIsCa)
    const nonCaCerts = certs.filter(c => !certificateIsCa(c))

    if (caCerts.length > 0 && nonCaCerts.length > 0) {
      caCert = caCerts[0]
      clientCert = nonCaCerts[0]
    } else {
      // Ambiguous (all CA or none CA) — disambiguate by filename.
      caCert = certs.find(nameLooksLikeCa)
      clientCert = certs.find(c => c !== caCert)
    }
  }

  if (caCert) {
    result.selfSignedCertificate = toField(caCert)
  }
  if (clientCert) {
    result.clientCertificate = toField(clientCert)
  }

  return result
}

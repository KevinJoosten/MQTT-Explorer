import { BundleEntry, mapCertificateBundle, MappedCertificateBundle } from './CertificateBundle'

// yauzl ships no bundled types; require avoids a hard @types dependency.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yauzl = require('yauzl')

const MAX_ENTRY_SIZE = 64 * 1024 // certs/keys are tiny; guard against zip bombs
const MAX_ENTRIES = 32

/**
 * Reads every (small) file entry out of a zip archive into memory.
 */
export function extractZipEntries(filePath: string): Promise<BundleEntry[]> {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (err: Error | null, zipfile: any) => {
      if (err || !zipfile) {
        reject(err || new Error('Could not open certificate bundle'))
        return
      }

      const entries: BundleEntry[] = []
      const finish = (error?: Error) => (error ? reject(error) : resolve(entries))

      zipfile.on('error', finish)
      zipfile.on('end', () => finish())
      zipfile.readEntry()

      zipfile.on('entry', (entry: any) => {
        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry()
          return
        }
        if (entries.length >= MAX_ENTRIES || entry.uncompressedSize > MAX_ENTRY_SIZE) {
          zipfile.readEntry()
          return
        }
        zipfile.openReadStream(entry, (streamErr: Error | null, stream: any) => {
          if (streamErr || !stream) {
            finish(streamErr || new Error('Could not read bundle entry'))
            return
          }
          const chunks: Buffer[] = []
          stream.on('data', (chunk: Buffer) => chunks.push(chunk))
          stream.on('error', finish)
          stream.on('end', () => {
            entries.push({ name: entry.fileName, content: Buffer.concat(chunks) })
            zipfile.readEntry()
          })
        })
      })
    })
  })
}

/**
 * Opens a certificate bundle zip and maps its files onto the connection cert slots.
 */
export async function readCertificateBundleFromZip(filePath: string): Promise<MappedCertificateBundle> {
  const entries = await extractZipEntries(filePath)
  return mapCertificateBundle(entries)
}

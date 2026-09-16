/**
 * Label for the tree's root node: the host, optionally followed by the stored
 * connection name. The name is left off when it would add nothing - when the
 * connection has none, or when it merely repeats the host, which is how the
 * default profiles are named.
 */
export function rootLabel(host?: string, connectionName?: string, showConnectionName?: boolean): string | undefined {
  const name = connectionName?.trim()
  if (!host || !showConnectionName || !name || name.toLowerCase() === host.toLowerCase()) {
    return host
  }

  return `${host} (${name})`
}

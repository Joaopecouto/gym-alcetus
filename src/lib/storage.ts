export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false
  }
  const already = await navigator.storage.persisted()
  if (already) return true
  return navigator.storage.persist()
}

export async function getStorageEstimate() {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null
  }
  return navigator.storage.estimate()
}

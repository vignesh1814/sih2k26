/**
 * Legal Metrology Inspector Offline Storage & Sync Service
 * Manages local IndexedDB / LocalStorage queue for field inspections without continuous internet
 */

export interface OfflineQueueItem {
  id: string
  type: 'INSPECTION_SESSION' | 'PACKAGE_SCAN' | 'QUANTITY_MEASUREMENT' | 'SEIZURE_MEMO'
  timestamp: number
  data: any
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED'
  error?: string
}

const STORAGE_KEY = 'sih26034_offline_queue'
const CACHE_ENTITIES_KEY = 'sih26034_cached_entities'
const CACHE_RULES_KEY = 'sih26034_cached_rules'

export const getOfflineQueue = (): OfflineQueueItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Error reading offline queue:', err)
    return []
  }
}

export const saveOfflineQueue = (items: OfflineQueueItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (err) {
    console.error('Error saving offline queue:', err)
  }
}

export const enqueueOfflineItem = (type: OfflineQueueItem['type'], data: any): OfflineQueueItem => {
  const item: OfflineQueueItem = {
    id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type,
    timestamp: Date.now(),
    data,
    status: 'PENDING_SYNC'
  }
  const queue = getOfflineQueue()
  queue.unshift(item)
  saveOfflineQueue(queue)
  return item
}

export const clearSyncedItems = () => {
  const queue = getOfflineQueue().filter(i => i.status === 'PENDING_SYNC' || i.status === 'FAILED')
  saveOfflineQueue(queue)
}

export const cacheEntitiesLocally = (entities: any[]) => {
  try {
    localStorage.setItem(CACHE_ENTITIES_KEY, JSON.stringify({ timestamp: Date.now(), data: entities }))
  } catch (e) {
    console.warn('Could not cache entities locally:', e)
  }
}

export const getCachedEntitiesLocally = (): any[] => {
  try {
    const raw = localStorage.getItem(CACHE_ENTITIES_KEY)
    return raw ? JSON.parse(raw).data : []
  } catch (e) {
    return []
  }
}

export const cacheRulesLocally = (rules: any[]) => {
  try {
    localStorage.setItem(CACHE_RULES_KEY, JSON.stringify({ timestamp: Date.now(), data: rules }))
  } catch (e) {
    console.warn('Could not cache rules locally:', e)
  }
}

export const getCachedRulesLocally = (): any[] => {
  try {
    const raw = localStorage.getItem(CACHE_RULES_KEY)
    return raw ? JSON.parse(raw).data : []
  } catch (e) {
    return []
  }
}

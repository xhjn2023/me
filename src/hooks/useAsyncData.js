import { useState, useEffect, useCallback, useRef } from 'react'

// 通用数据获取 Hook，替代 dexie-react-hooks 的 useLiveQuery
export function useAsyncData(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const mountedRef = useRef(true)

  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  useEffect(() => {
    mountedRef.current = true
    setLoading(true)
    fetcher()
      .then(result => {
        if (mountedRef.current) {
          setData(result)
          setError(null)
        }
      })
      .catch(err => {
        if (mountedRef.current) {
          setError(err)
          console.error('数据获取失败:', err)
        }
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false)
      })
    return () => { mountedRef.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshKey])

  return { data, loading, error, refresh }
}

// 全局刷新事件 - 任何 CRUD 操作后可以触发
const listeners = new Set()
export function triggerGlobalRefresh() {
  listeners.forEach(fn => fn())
}
export function useGlobalRefresh(callback) {
  useEffect(() => {
    listeners.add(callback)
    return () => listeners.delete(callback)
  }, [callback])
}

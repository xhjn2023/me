// 每日天气卡片（首页）
// 数据源：Open-Meteo（免费、无需 API Key、支持 CORS）
// 位置策略：localStorage 记住城市 → 首次自动定位 → 失败回退北京
// 缓存：30 分钟内直接用缓存，过期先显示缓存再后台刷新
import { useCallback, useEffect, useRef, useState } from 'react'
import { BottomSheet } from './ui'
import { Icon } from './ui/icons'

// —— WMO 天气代码 → 中文 / emoji / 渐变背景 ——
const WEATHER_MAP = [
  { codes: [0], label: '晴', emoji: '☀️', bg: 'from-sky-100 via-sky-50 to-blue-100' },
  { codes: [1], label: '大部晴朗', emoji: '🌤️', bg: 'from-sky-100 via-sky-50 to-blue-100' },
  { codes: [2], label: '多云', emoji: '⛅', bg: 'from-slate-100 via-sky-50 to-slate-100' },
  { codes: [3], label: '阴', emoji: '☁️', bg: 'from-slate-100 via-slate-50 to-slate-200' },
  { codes: [45, 48], label: '雾', emoji: '🌫️', bg: 'from-slate-100 via-slate-50 to-slate-200' },
  { codes: [51, 53, 55, 56, 57], label: '毛毛雨', emoji: '🌦️', bg: 'from-sky-100 via-sky-50 to-blue-100' },
  { codes: [61, 63, 65, 66, 67], label: '雨', emoji: '🌧️', bg: 'from-sky-100 via-blue-50 to-blue-100' },
  { codes: [71, 73, 75, 77], label: '雪', emoji: '❄️', bg: 'from-sky-50 via-slate-50 to-slate-100' },
  { codes: [80, 81, 82], label: '阵雨', emoji: '🌦️', bg: 'from-sky-100 via-blue-50 to-blue-100' },
  { codes: [85, 86], label: '阵雪', emoji: '🌨️', bg: 'from-sky-50 via-slate-50 to-slate-100' },
  { codes: [95, 96, 99], label: '雷阵雨', emoji: '⛈️', bg: 'from-indigo-100 via-sky-50 to-slate-200' },
]

// 常用城市快捷选择
const PRESET_CITIES = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '广州', lat: 23.1291, lon: 113.2644 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '杭州', lat: 30.2741, lon: 120.1551 },
  { name: '成都', lat: 30.5728, lon: 104.0668 },
  { name: '武汉', lat: 30.5928, lon: 114.3055 },
  { name: '西安', lat: 34.3416, lon: 108.9398 },
  { name: '南京', lat: 32.0603, lon: 118.7969 },
  { name: '重庆', lat: 29.563, lon: 106.5516 },
]

const CACHE_KEY = 'wb_weather_v1'
const CACHE_MAX_AGE = 30 * 60 * 1000 // 30 分钟
const DEFAULT_LOC = { name: '北京', lat: 39.9042, lon: 116.4074 }

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw)
    if (!c?.loc?.lat || !c?.weather) return null
    return c
  } catch {
    return null
  }
}

// 天气查询（Open-Meteo）
async function fetchWeather(lat, lon) {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,wind_speed_10m' +
    '&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`weather http ${res.status}`)
  const d = await res.json()
  if (!d?.current) throw new Error('weather empty response')
  return {
    temp: Math.round(d.current.temperature_2m),
    feels: Math.round(d.current.apparent_temperature),
    humidity: d.current.relative_humidity_2m,
    wind: Math.round(d.current.wind_speed_10m),
    code: d.current.weather_code,
    isDay: d.current.is_day === 1,
    tMax: Math.round(d.daily.temperature_2m_max[0]),
    tMin: Math.round(d.daily.temperature_2m_min[0]),
  }
}

// 城市搜索（Open-Meteo Geocoding，仅保留国内城市）
async function searchCity(q) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=zh&format=json`
  const res = await fetch(url)
  if (!res.ok) return []
  const d = await res.json()
  return (d.results || [])
    .filter(r => r.country_code === 'CN')
    .map(r => ({ name: r.name, admin: r.admin1 || '', lat: r.latitude, lon: r.longitude }))
}

// 坐标反查城市名（BigDataCloud，免费无需 key）
async function reverseGeocode(lat, lon) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`
  const res = await fetch(url)
  const d = await res.json()
  return d.city || d.locality || d.principalSubdivision || '当前位置'
}

// 天气代码 → 展示信息（晴夜用月亮）
function getCondition(code, isDay) {
  const item = WEATHER_MAP.find(w => w.codes.includes(code)) || WEATHER_MAP[2]
  if (code === 0 && !isDay) return { label: '晴夜', emoji: '🌙', bg: item.bg }
  return item
}

export default function WeatherCard() {
  const [weather, setWeather] = useState(null)
  const [loc, setLoc] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [picker, setPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const requestIdRef = useRef(0)

  const load = useCallback(async (location, opts = {}) => {
    const id = ++requestIdRef.current
    if (!opts.silent) setStatus('loading')
    try {
      const w = await fetchWeather(location.lat, location.lon)
      if (requestIdRef.current !== id) return
      setLoc(location)
      setWeather(w)
      setStatus('ready')
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ loc: location, weather: w, at: Date.now() }))
      } catch { /* ignore */ }
    } catch (e) {
      if (requestIdRef.current !== id) return
      // 失败时降级到缓存；无缓存则显示错误态
      const cache = readCache()
      if (cache) {
        setLoc(cache.loc)
        setWeather(cache.weather)
        setStatus('ready')
      } else {
        setStatus('error')
      }
    }
  }, [])

  // 首次加载：缓存优先，其次定位，最后回退默认城市
  useEffect(() => {
    const cache = readCache()
    if (cache) {
      setLoc(cache.loc)
      setWeather(cache.weather)
      setStatus('ready')
      if (Date.now() - cache.at >= CACHE_MAX_AGE) {
        load(cache.loc, { silent: true }) // 过期：后台刷新
      }
      return
    }
    const useGeo = () => {
      if (!navigator.geolocation) {
        load(DEFAULT_LOC)
        return
      }
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const { latitude, longitude } = pos.coords
          let name = '当前位置'
          try { name = await reverseGeocode(latitude, longitude) } catch { /* ignore */ }
          load({ name, lat: latitude, lon: longitude })
        },
        () => load(DEFAULT_LOC),
        { timeout: 6000, maximumAge: 600000 }
      )
    }
    useGeo()
  }, [load])

  // 城市搜索（防抖）
  useEffect(() => {
    if (!picker) {
      setSearch('')
      setResults([])
      return
    }
    if (!search.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        setResults(await searchCity(search.trim()))
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [search, picker])

  const pick = item => {
    setPicker(false)
    load(item)
  }

  const useMyLocation = () => {
    setPicker(false)
    if (!navigator.geolocation) {
      load(DEFAULT_LOC)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        let name = '当前位置'
        try { name = await reverseGeocode(latitude, longitude) } catch { /* ignore */ }
        load({ name, lat: latitude, lon: longitude })
      },
      () => load(DEFAULT_LOC),
      { timeout: 6000, maximumAge: 600000 }
    )
  }

  // —— 加载骨架 ——
  if (status === 'loading' && !weather) {
    return (
      <div className="px-4 mt-5">
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 animate-pulse">
          <div className="h-3 w-14 bg-slate-100 rounded mb-3" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-9 w-16 bg-slate-100 rounded" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
            <div className="w-14 h-14 rounded-full bg-slate-100" />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="h-3 w-32 bg-slate-100 rounded mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  // —— 错误态（无缓存可用）——
  if (status === 'error' && !weather) {
    return (
      <div className="px-4 mt-5">
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Icon name="cloud" size={18} />
            </span>
            <div>
              <p className="text-sm text-slate-600">天气暂时获取失败</p>
              <p className="text-xs text-slate-400 mt-0.5">检查网络后重试</p>
            </div>
          </div>
          <button
            onClick={() => load(loc || DEFAULT_LOC)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition btn-press"
          >
            <Icon name="refreshCw" size={13} /> 重试
          </button>
        </div>
      </div>
    )
  }

  if (!weather) return null

  const cond = getCondition(weather.code, weather.isDay)

  return (
    <div className="px-4 mt-5">
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cond.bg} border border-white/60 p-4 shadow-sm`}>
        {/* 顶部：城市 + 操作 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPicker(true)}
            className="flex items-center gap-1 text-sm font-medium text-slate-700 btn-press"
          >
            <Icon name="mapPin" size={15} className="text-slate-500" />
            <span className="max-w-[140px] truncate">{loc?.name || '未知'}</span>
            <Icon name="chevronDown" size={13} className="text-slate-400" />
          </button>
          <button
            onClick={() => load(loc, { silent: true })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition btn-press"
            aria-label="刷新天气"
            title="刷新天气"
          >
            <Icon name="refreshCw" size={14} />
          </button>
        </div>

        {/* 主体：温度 + 大 emoji */}
        <div className="flex items-center justify-between mt-1">
          <div>
            <div className="flex items-baseline">
              <span className="text-5xl font-bold text-slate-800 tabular-nums leading-none">{weather.temp}°</span>
              <span className="text-xs text-slate-500 ml-1.5">体感 {weather.feels}°</span>
            </div>
            <p className="text-sm text-slate-600 mt-1.5">{cond.label}</p>
          </div>
          <div className="text-6xl leading-none drop-shadow-sm" aria-hidden="true">{cond.emoji}</div>
        </div>

        {/* 底部：高低温 / 湿度 / 风速 */}
        <div className="mt-3 pt-3 border-t border-white/60 flex items-center justify-around">
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <Icon name="arrowUp" size={13} className="text-rose-400" /> {weather.tMax}°
            <Icon name="arrowDown" size={13} className="text-sky-500" /> {weather.tMin}°
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <Icon name="drop" size={13} className="text-sky-400" /> 湿度 {weather.humidity}%
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <Icon name="wind" size={13} className="text-slate-400" /> 风 {weather.wind} km/h
          </span>
        </div>
      </div>

      {/* 城市选择弹层 */}
      <BottomSheet open={picker} onClose={() => setPicker(false)} title="选择城市">
        <div className="space-y-3">
          <button
            onClick={useMyLocation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-50 text-sky-600 text-sm font-medium hover:bg-sky-100 transition btn-press"
          >
            <Icon name="mapPin" size={16} /> 使用我的位置
          </button>

          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索城市，如：苏州"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition"
            />
          </div>

          {!search.trim() ? (
            <div className="flex flex-wrap gap-2">
              {PRESET_CITIES.map(c => (
                <button
                  key={c.name}
                  onClick={() => pick(c)}
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition btn-press"
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : searching ? (
            <p className="text-xs text-slate-400 text-center py-3">搜索中...</p>
          ) : (
            <div className="space-y-1">
              {results.length === 0 && <p className="text-xs text-slate-400 text-center py-3">未找到相关城市</p>}
              {results.map((r, i) => (
                <button
                  key={`${r.name}-${i}`}
                  onClick={() => pick(r)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition text-left"
                >
                  <span className="text-sm text-slate-700">{r.name}</span>
                  {r.admin && <span className="text-xs text-slate-400">{r.admin}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

interface RestState {
  startedAt: number
  durationSeconds: number
}

const STORAGE_KEY = 'iron-track:rest-timer'

function loadStoredRest(): RestState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed.startedAt === 'number' &&
      typeof parsed.durationSeconds === 'number'
    ) {
      return parsed
    }
  } catch {
    /* noop */
  }
  return null
}

/**
 * Timer de descanso baseado em timestamps. Resiliente a:
 * - tab em background no Safari iOS
 * - app fechado/reaberto durante o descanso
 * - múltiplos tabs abertos (storage event sincroniza)
 */
export function useRestTimer() {
  const [rest, setRest] = useState<RestState | null>(() => loadStoredRest())
  const [now, setNow] = useState(() => Date.now())
  const lastFiredRef = useRef<number | null>(null)

  // Tick a cada 250ms enquanto há descanso ativo
  useEffect(() => {
    if (!rest) return
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [rest])

  // Persistência + sync entre tabs
  useEffect(() => {
    if (rest) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      setRest(loadStoredRest())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [rest])

  const remainingMs = rest
    ? Math.max(0, rest.startedAt + rest.durationSeconds * 1000 - now)
    : 0
  const remaining = Math.ceil(remainingMs / 1000)
  const elapsed = rest ? Math.floor((now - rest.startedAt) / 1000) : 0
  const progress = rest
    ? Math.min(1, elapsed / rest.durationSeconds)
    : 0

  // Beep + vibração quando zera
  useEffect(() => {
    if (!rest) return
    if (remainingMs > 0) return
    if (lastFiredRef.current === rest.startedAt) return
    lastFiredRef.current = rest.startedAt

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 80, 200])
    }
    // Beep sintetizado via Web Audio API — não precisa de asset
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.42)
      osc.onended = () => ctx.close()
    } catch {
      /* noop */
    }
  }, [rest, remainingMs])

  function start(durationSeconds: number) {
    setRest({ startedAt: Date.now(), durationSeconds })
  }

  function stop() {
    setRest(null)
  }

  function adjust(deltaSeconds: number) {
    if (!rest) return
    const nextDuration = Math.max(0, rest.durationSeconds + deltaSeconds)
    setRest({ ...rest, durationSeconds: nextDuration })
  }

  return {
    active: !!rest,
    remaining,
    progress,
    durationSeconds: rest?.durationSeconds ?? 0,
    start,
    stop,
    adjust,
  }
}


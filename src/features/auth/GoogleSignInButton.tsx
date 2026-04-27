import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { useUser } from '@/stores/user'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

let gsiPromise: Promise<void> | null = null
function loadGsi(): Promise<void> {
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`,
    )
    const onLoad = () => resolve()
    const onError = () => reject(new Error('Falha ao carregar Google Identity Services'))
    if (existing) {
      existing.addEventListener('load', onLoad)
      existing.addEventListener('error', onError)
    } else {
      const s = document.createElement('script')
      s.src = GSI_SRC
      s.async = true
      s.defer = true
      s.addEventListener('load', onLoad)
      s.addEventListener('error', onError)
      document.head.appendChild(s)
    }
  })
  return gsiPromise
}

export function GoogleSignInButton() {
  const containerRef = useRef<HTMLDivElement>(null)
  const setUser = useUser((s) => s.setUser)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId) {
      setError('VITE_GOOGLE_CLIENT_ID não configurado.')
      return
    }
    let cancelled = false

    loadGsi()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp) => {
            if (!resp.credential) {
              setError('Não recebi credential do Google.')
              return
            }
            setLoading(true)
            setError(null)
            try {
              await api.loginWithGoogle(resp.credential)
              const me = await api.me()
              setUser(me)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Falha no login.')
            } finally {
              setLoading(false)
            }
          },
        })

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          locale: 'pt-BR',
          width: 280,
        })
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [clientId, setUser])

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={containerRef} aria-busy={loading} />
      {loading ? (
        <p className="text-sm text-muted-foreground">Entrando…</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

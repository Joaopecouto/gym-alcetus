/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Google Identity Services (carregado via <script>)
interface GoogleIdConfig {
  client_id: string
  callback: (response: { credential: string; select_by?: string }) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
}

interface GoogleIdRenderConfig {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdConfig) => void
        renderButton: (parent: HTMLElement, config: GoogleIdRenderConfig) => void
        prompt: () => void
        disableAutoSelect: () => void
      }
    }
  }
}

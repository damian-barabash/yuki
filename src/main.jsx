import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './auth.jsx'
import App from './App.jsx'
import './styles.css'

const root = createRoot(document.getElementById('root'))

if (import.meta.env.DEV && location.hash === '#gallery') {
  import('./dev/Gallery.jsx').then(({ default: Gallery }) => root.render(<Gallery />))
} else {
  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
}

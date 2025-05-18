import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './BackgroundFix.css'
import AppRouter from './routes/AppRouter.jsx'
import { AuthProvider } from './context/AuthContext'
import { WebSocketProvider } from './context/WebSocketContext'
import { AiProvider } from './context/AiContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <WebSocketProvider>
        <AiProvider>
          <AppRouter />
        </AiProvider>
      </WebSocketProvider>
    </AuthProvider>
  </StrictMode>,
)

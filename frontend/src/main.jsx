import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Aquí inicializo React montando el componente raíz dentro del div con id "root" que entrega Vite.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* StrictMode me ayuda a detectar efectos secundarios o malas prácticas durante el desarrollo. */}
    <App />
  </StrictMode>,
)

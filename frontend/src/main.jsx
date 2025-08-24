import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../Context/AuthContext.jsx'
import { ProductProvider } from '../Context/ProductContext.jsx'
import { CartProvider } from '../Context/CartContext.jsx'
import { UserProvider } from '../Context/UserContext.jsx'
import ConditionalProvider from './ConditionalProvider.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
      <AuthProvider>
        <ConditionalProvider>
    <App />
        </ConditionalProvider>
        </AuthProvider>
  </BrowserRouter>,
)

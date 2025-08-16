import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../Context/AuthContext.jsx'
import { ProductProvider } from '../Context/ProductContext.jsx'
import { CartProvider } from '../Context/CartContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
    <App />
          </CartProvider>
      </ProductProvider>
        </AuthProvider>
  </BrowserRouter>,
)

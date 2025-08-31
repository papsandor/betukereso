import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import soundService from './services/SoundService'
import { LETTER_SNIPPETS } from './services/letterSnippets'

// Register uploaded snippets on app bootstrap
Object.entries(LETTER_SNIPPETS).forEach(([g, url]) => {
  soundService.registerLetterSnippet(g, url)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
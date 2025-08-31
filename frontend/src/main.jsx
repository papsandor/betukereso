import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import soundService from './services/SoundService'
import { LOWERCASE_SNIPPETS, UPPERCASE_SNIPPETS } from './services/letterSnippets'

// Register uploaded snippets on app bootstrap
Object.entries(LOWERCASE_SNIPPETS).forEach(([g, url]) => {
  soundService.registerLetterSnippet(g, url)
})
Object.entries(UPPERCASE_SNIPPETS).forEach(([g, url]) => {
  soundService.registerUpperLetterSnippet(g, url)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
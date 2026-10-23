import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import App from './App'
import { applyFontsToDocument, readPersistedUi } from './hooks/useUiSettings'
import { applyTheme } from './ui/themes'
import './index.css'

const persisted = readPersistedUi()
applyFontsToDocument(persisted)
applyTheme(persisted.theme)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

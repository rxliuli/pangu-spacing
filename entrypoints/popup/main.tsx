import ReactDOM from 'react-dom/client'
import '@/assets/style.css'
import { startUiLanguage } from '@/hooks/use-ui-language'
import { App } from './App'

// Render after the language setting is applied, so the popup never flashes the browser language first
void startUiLanguage('extension_name')
  .catch(console.error)
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
  })

import ReactDOM from 'react-dom/client'
import '@/assets/style.css'
import { applyDocumentLanguage } from '@/lib/i18n'
import { App } from './App'

applyDocumentLanguage('extension_name')
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)

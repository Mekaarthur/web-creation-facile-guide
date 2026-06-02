import { createRoot } from 'react-dom/client'
import i18n from './i18n'
import App from './App.tsx'
import './index.css'

// Restore language preference and sync <html lang>
try {
  const savedLang = localStorage.getItem('i18n_lang');
  if (savedLang && i18n.language !== savedLang) {
    i18n.changeLanguage(savedLang);
  }
  document.documentElement.lang = i18n.language;
} catch {}

createRoot(document.getElementById('root')!).render(<App />);

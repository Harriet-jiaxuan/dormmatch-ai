import { Languages } from 'lucide-react'
import { useI18n } from '../i18n.js'
import { Stepper } from './Stepper.jsx'

export function AppShell({ children, currentStep, onStepClick, locked, language, onLanguageChange, errorStep }) {
  const { t } = useI18n()

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand" aria-label="DormMatch">DormMatch</div>
        <div className="header-actions">
          <button
            className="language-toggle"
            type="button"
            onClick={() => onLanguageChange(language === 'en' ? 'zh' : 'en')}
            aria-label={t('header.switchLanguage')}
          >
            <Languages size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>{language === 'en' ? '中文' : 'EN'}</span>
          </button>
        </div>
      </header>
      <div className="progress-wrap">
        <Stepper currentStep={currentStep} onStepClick={onStepClick} locked={locked} language={language} errorStep={errorStep} />
      </div>
      <main className="main-content">{children}</main>
    </div>
  )
}

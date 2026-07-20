import { useEffect } from 'react'
import { CheckCircle, IdentificationCard, WarningCircle } from '@phosphor-icons/react'
import { PrimaryButton, SecondaryButton } from '../components/Controls.jsx'
import { demoApplicant } from '../data.js'
import { useI18n } from '../i18n.js'

export function EligibilityStep({ state, setState, onComplete }) {
  const { t } = useI18n()

  useEffect(() => {
    if (state !== 'verifying') return undefined
    const timer = window.setTimeout(() => setState('verified'), 900)
    return () => window.clearTimeout(timer)
  }, [state, setState])

  if (state === 'verifying') {
    return (
      <section className="narrow-page centered-status" aria-live="polite">
        <div className="status-symbol status-loading"><IdentificationCard size={34} aria-hidden="true" /></div>
        <h1>{t('eligibility.checkingTitle')}</h1>
        <p>{t('eligibility.checkingBody')}</p>
        <div className="skeleton-lines" aria-hidden="true"><span /><span /><span /></div>
      </section>
    )
  }

  if (state === 'error') {
    return (
      <section className="narrow-page centered-status">
        <div className="status-symbol status-error"><WarningCircle size={34} aria-hidden="true" /></div>
        <h1>{t('eligibility.errorTitle')}</h1>
        <p>{t('eligibility.errorBody')}</p>
        <div className="inline-error">{t('eligibility.errorDetail')}</div>
        <PrimaryButton onClick={() => setState('verifying')}>{t('eligibility.tryAgain')}</PrimaryButton>
      </section>
    )
  }

  if (state === 'verified') {
    return (
      <section className="narrow-page">
        <div className="page-heading">
          <h1>{t('eligibility.verifiedTitle')}</h1>
          <p>{t('eligibility.verifiedBody')}</p>
        </div>
        <div className="verification-panel">
          <div className="verification-title">
            <CheckCircle size={26} weight="fill" aria-hidden="true" />
            <strong>{t('eligibility.verifiedBy')}</strong>
          </div>
          <dl className="detail-list">
            <div><dt>{t('eligibility.name')}</dt><dd>{demoApplicant.name}</dd></div>
            <div><dt>{t('eligibility.eid')}</dt><dd>{demoApplicant.eid}</dd></div>
            <div><dt>{t('eligibility.eligibility')}</dt><dd>{t('eligibility.eligible')}</dd></div>
            <div><dt>{t('eligibility.gender')}</dt><dd>{t('eligibility.femaleHousing')}</dd></div>
          </dl>
        </div>
        <PrimaryButton className="full-width-mobile" onClick={onComplete}>{t('eligibility.start')}</PrimaryButton>
      </section>
    )
  }

  return (
    <section className="landing-page">
      <div className="landing-copy">
        <h1>{t('eligibility.entryTitle')}</h1>
        <p>{t('eligibility.entryBody')}</p>
        <PrimaryButton onClick={() => setState('verifying')}>{t('eligibility.continueEid')}</PrimaryButton>
        <SecondaryButton className="demo-error-button" onClick={() => setState('error')}>{t('eligibility.previewError')}</SecondaryButton>
      </div>
      <aside className="application-window" aria-label={t('eligibility.timingAria')}>
        <p className="window-label">{t('eligibility.residence')}</p>
        <h2>{t('eligibility.windowTitle')}</h2>
        <div className="time-row"><span>{t('eligibility.opens')}</span><strong>08:00</strong></div>
        <div className="time-row"><span>{t('eligibility.matchingBegins')}</span><strong>10:00</strong></div>
        <p className="window-note">{t('eligibility.timingNote')}</p>
      </aside>
    </section>
  )
}

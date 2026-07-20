import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, CreditCard, LockKey, ShieldCheck, WarningCircle } from '@phosphor-icons/react'
import { formatCurrency, lifestyleQuestions, localizeAnswer, localizeRoom, roomTypes } from '../data.js'
import { BackButton, PageActions, PrimaryButton, SecondaryButton } from '../components/Controls.jsx'
import { useI18n } from '../i18n.js'

export function ReviewAuthorizeStep({ choices, order, answers, onBack, editRooms, editLifestyle, onAuthorized }) {
  const { language, t } = useI18n()
  const [phase, setPhase] = useState('review')
  const [agreements, setAgreements] = useState({ assignment: false, guarantee: false })
  const [processing, setProcessing] = useState(false)
  const localizedRooms = useMemo(() => roomTypes.map((room) => localizeRoom(room, language)), [language])
  const accepted = localizedRooms.filter((room) => choices[room.id] === 'accept')
  const ordered = order.map((id) => accepted.find((room) => room.id === id)).filter(Boolean)
  const rooms = ordered.length ? ordered : accepted
  const maximum = useMemo(() => Math.max(...accepted.map((room) => room.price)), [accepted])

  useEffect(() => () => undefined, [])

  const authorize = () => {
    setProcessing(true)
    window.setTimeout(() => {
      setProcessing(false)
      onAuthorized(maximum)
    }, 1000)
  }

  if (phase === 'error') {
    return (
      <section className="narrow-page centered-status">
        <div className="status-symbol status-error"><WarningCircle size={34} aria-hidden="true" /></div>
        <h1>{t('review.paymentErrorTitle')}</h1>
        <p>{t('review.paymentErrorBody')}</p>
        <div className="inline-error">{t('review.paymentErrorDetail')}</div>
        <PrimaryButton onClick={() => setPhase('authorize')}>{t('review.tryAgain')}</PrimaryButton>
      </section>
    )
  }

  if (phase === 'authorize') {
    return (
      <section className="content-page authorization-page">
        <div className="page-heading">
          <h1>{t('review.authorizeTitle')}</h1>
          <p>{t('review.authorizeBody')}</p>
        </div>
        <div className="authorization-layout">
          <div className="authorization-amount">
            <CreditCard size={28} aria-hidden="true" />
            <span>{t('review.maximumAuthorization')}</span>
            <strong>{formatCurrency(maximum)}</strong>
            <small>{t('review.currentCharge')}</small>
          </div>
          <div className="payment-rules">
            <div><CheckCircle size={20} weight="fill" /><span>{t('review.matchedRule')}</span></div>
            <div><CheckCircle size={20} weight="fill" /><span>{t('review.unmatchedRule')}</span></div>
            <div><ShieldCheck size={20} /><span>{t('review.cardRule')}</span></div>
          </div>
        </div>
        <div className="agreement-list">
          <label><input type="checkbox" checked={agreements.assignment} onChange={(event) => setAgreements((current) => ({ ...current, assignment: event.target.checked }))} /><span>{t('review.assignmentAgreement')}</span></label>
          <label><input type="checkbox" checked={agreements.guarantee} onChange={(event) => setAgreements((current) => ({ ...current, guarantee: event.target.checked }))} /><span>{t('review.guaranteeAgreement')}</span></label>
        </div>
        <div className="secure-note"><LockKey size={18} aria-hidden="true" />{t('review.secureNote')}</div>
        <div className="page-actions">
          <BackButton onClick={() => setPhase('review')} disabled={processing} />
          <div className="action-right">
            <SecondaryButton onClick={() => setPhase('error')} disabled={processing}>{t('review.cancelAuthorization')}</SecondaryButton>
            <PrimaryButton onClick={authorize} disabled={!agreements.assignment || !agreements.guarantee || processing}>{processing ? t('review.authorizing') : t('review.authorizeUpTo', { amount: formatCurrency(maximum) })}</PrimaryButton>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="content-page">
      <div className="page-heading">
        <h1>{t('review.applicationTitle')}</h1>
        <p>{t('review.applicationBody')}</p>
      </div>
      <div className="review-sections">
        <section>
          <div className="review-title"><h2>{t('review.identityTitle')}</h2><span className="verified-text"><CheckCircle size={18} weight="fill" />{t('review.verified')}</span></div>
          <dl className="review-grid"><div><dt>{t('eligibility.name')}</dt><dd>Jiaxuan Xu</dd></div><div><dt>{t('eligibility.eid')}</dt><dd>jiax***</dd></div><div><dt>{t('eligibility.gender')}</dt><dd>{t('eligibility.femaleHousing')}</dd></div></dl>
        </section>
        <section>
          <div className="review-title"><h2>{t('review.roomTitle')}</h2><button type="button" onClick={editRooms}>{t('common.edit')}</button></div>
          <ol className="review-room-list">{rooms.map((room, index) => <li key={room.id}><span>{index + 1}</span><div><strong>{room.name}</strong><small>{formatCurrency(room.price)}</small></div></li>)}</ol>
          <p className="review-meta">{t('review.highestPossible', { amount: formatCurrency(maximum) })}</p>
        </section>
        <section>
          <div className="review-title"><h2>{t('review.lifestyleTitle')}</h2><button type="button" onClick={editLifestyle}>{t('common.edit')}</button></div>
          <div className="lifestyle-review">{lifestyleQuestions.map((question) => <span key={question.id}>{localizeAnswer(question, answers[question.id], language)}</span>)}</div>
        </section>
      </div>
      <PageActions back={onBack} next={() => setPhase('authorize')} nextLabel={t('review.continueAuthorization')} />
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Check, CheckCircle, Circle, Info, Receipt, Sparkle, SpinnerGap, XCircle } from '@phosphor-icons/react'
import { formatCurrency, localizeRoom, roomTypes } from '../data.js'
import { demoSuiteCandidates } from '../demoSuiteCandidates.js'
import { MATCH_OUTCOME, MATCH_REASON, runAllocation } from '../matchingEngine.js'
import { createSuitePlacement } from '../suiteMatching.js'
import { PrimaryButton, SecondaryButton } from '../components/Controls.jsx'
import { useI18n } from '../i18n.js'

export function MatchingPoolStep({ authorizationLimit, choices, order, answers, onEdit, onLockChange }) {
  const { language, t } = useI18n()
  const [status, setStatus] = useState('waiting')
  const [seconds, setSeconds] = useState(42 * 60 + 18)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [pendingMatchResult, setPendingMatchResult] = useState(null)
  const [matchResult, setMatchResult] = useState(null)
  const localizedRooms = useMemo(() => roomTypes.map((room) => localizeRoom(room, language)), [language])
  const accepted = localizedRooms.filter((room) => choices[room.id] === 'accept')
  const preferred = order.map((id) => accepted.find((room) => room.id === id)).filter(Boolean)
  const matchedRoom = localizedRooms.find((room) => room.id === matchResult?.allocatedRoomId)

  useEffect(() => {
    if (status !== 'waiting') return undefined
    const timer = window.setInterval(() => setSeconds((current) => Math.max(0, current - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [status])

  useEffect(() => {
    onLockChange(status !== 'waiting')
  }, [status, onLockChange])

  useEffect(() => {
    if (status !== 'processing') return undefined
    if (processingStep < 4) {
      const timer = window.setTimeout(() => setProcessingStep((current) => current + 1), 700)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => {
      setMatchResult(pendingMatchResult)
      setStatus(pendingMatchResult?.outcome || MATCH_OUTCOME.FAILED)
    }, 650)
    return () => window.clearTimeout(timer)
  }, [pendingMatchResult, processingStep, status])

  const time = useMemo(() => {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${hours}:${minutes}:${secs}`
  }, [seconds])

  const runMatch = (outcome, number = outcome === MATCH_OUTCOME.FAILED ? '219' : '083') => {
    const preferredRoom = preferred[0] || accepted[0]
    const applicant = {
      id: 'current-student',
      lotteryNumber: number,
      acceptedRoomIds: accepted.map((room) => room.id),
      preferenceOrder: preferred.map((room) => room.id),
      partition: 'female',
    }
    const demoBeds = outcome === MATCH_OUTCOME.SUCCESS && preferredRoom
      ? [{
          id: preferredRoom.resultBed,
          roomId: preferredRoom.id,
          suiteId: 'S08',
          price: preferredRoom.price,
          partition: 'female',
        }]
      : []
    const allocation = runAllocation({ applicants: [applicant], beds: demoBeds })

    const allocationResult = allocation.results[0]
    const suitePlacement = allocationResult?.outcome === MATCH_OUTCOME.SUCCESS
      ? createSuitePlacement(answers, demoSuiteCandidates, 7)
      : null

    setPendingMatchResult({ ...allocationResult, suitePlacement })
    setMatchResult(null)
    setProcessingStep(0)
    setStatus('processing')
  }

  const lotteryNumber = matchResult?.lotteryNumber || pendingMatchResult?.lotteryNumber
  const preferenceLabel = matchResult?.allocatedPreferenceRank === 1
    ? t('pool.firstChoice')
    : matchResult?.allocatedPreferenceRank === 2
      ? t('pool.secondChoice')
      : t('pool.preferenceChoice', { rank: matchResult?.allocatedPreferenceRank })
  const explanationBody = matchResult?.reasonCode === MATCH_REASON.FIRST_PREFERENCE_AVAILABLE
    ? t('pool.resultExplanationFirstChoice', { number: lotteryNumber })
    : t('pool.resultExplanationAlternative', {
        number: lotteryNumber,
        unavailableCount: matchResult?.unavailablePreferenceIds.length || 0,
        rank: matchResult?.allocatedPreferenceRank,
      })
  const suitePlacement = matchResult?.suitePlacement
  const strongestDimensions = suitePlacement?.strongestDimensionIds
    .map((dimensionId) => t(`pool.dimension.${dimensionId}`))
    .join(' · ')

  if (status === 'processing') {
    const processItems = [
      t('pool.processLocked'),
      t('pool.processLottery'),
      t('pool.processRooms'),
      t('pool.processSuites'),
    ]
    return (
      <section className="narrow-page centered-status processing-page" aria-live="polite">
        <div className="status-symbol status-loading"><SpinnerGap className="process-spinner" size={34} aria-hidden="true" /></div>
        <h1>{t('pool.processingTitle')}</h1>
        <p>{t('pool.processingBody')}</p>
        <div className="processing-lottery"><span>{t('pool.processingLotteryLabel')}</span><strong>{lotteryNumber}</strong></div>
        <div className="process-list">
          {processItems.map((label, index) => {
            const complete = index < processingStep
            const active = index === processingStep && processingStep < processItems.length
            return (
              <div className={`process-item${complete ? ' is-complete' : ''}${active ? ' is-active' : ''}`} key={label}>
                <span className="process-indicator">
                  {complete && <Check size={18} weight="bold" aria-hidden="true" />}
                  {active && <SpinnerGap className="process-spinner" size={20} aria-hidden="true" />}
                  {!complete && !active && <Circle size={17} aria-hidden="true" />}
                </span>
                <span>{label}</span>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  if (status === 'success') {
    return (
      <section className="content-page result-page">
        <div className="result-heading"><CheckCircle size={40} weight="fill" aria-hidden="true" /><div><h1>{t('pool.successTitle')}</h1><p>{t('pool.successBody')}</p></div></div>
        <div className="result-layout">
          <dl className="result-details">
            <div><dt>{t('pool.residence')}</dt><dd>{t('eligibility.residence')}</dd></div>
            <div><dt>{t('pool.suite')}</dt><dd>{matchResult.suiteId}</dd></div>
            <div><dt>{t('pool.bedroom')}</dt><dd>{matchedRoom.name}</dd></div>
            <div><dt>{t('pool.bed')}</dt><dd>{matchResult.bedId}</dd></div>
            <div><dt>{t('pool.roomType')}</dt><dd>{matchedRoom.occupancy}</dd></div>
            <div><dt>{t('pool.preferenceSatisfied')}</dt><dd>{preferenceLabel}</dd></div>
          </dl>
          <aside className="receipt-card"><Receipt size={27} aria-hidden="true" /><span>{t('pool.amountCharged')}</span><strong>{formatCurrency(matchResult.amountCharged)}</strong><small>{t('pool.paymentCompleted')}</small></aside>
        </div>
        {suitePlacement && (
          <section className="suite-match-card" aria-label={t('pool.compatibilityTitle')}>
            <div className="suite-score"><span>{t('pool.compatibilityTitle')}</span><strong>{suitePlacement.compatibilityScore}%</strong></div>
            <div className="suite-match-copy">
              <strong>{t('pool.suiteMatesArranged', { count: suitePlacement.suiteMateCount })}</strong>
              <p>{t('pool.compatibilityBody')}</p>
              <span>{t('pool.strongestAlignment', { dimensions: strongestDimensions })}</span>
            </div>
          </section>
        )}
        <div className="lottery-row"><span>{t('pool.lotteryPriority')}</span><strong>{lotteryNumber}</strong></div>
        <button className="explanation-toggle" type="button" onClick={() => setExplanationOpen((open) => !open)}>{explanationOpen ? t('pool.hideExplanation') : t('pool.whyResult')}</button>
        {explanationOpen && <div className="result-explanation"><Sparkle size={22} aria-hidden="true" /><div><strong>{t('pool.resultExplanationTitle')}</strong><p>{explanationBody}</p></div></div>}
      </section>
    )
  }

  if (status === 'failed') {
    return (
      <section className="content-page result-page failure-page">
        <div className="result-heading failed-heading"><XCircle size={40} weight="fill" aria-hidden="true" /><div><h1>{t('pool.failureTitle')}</h1><p>{t('pool.failureBody')}</p></div></div>
        <div className="failure-stats"><div><span>{t('pool.lotteryPriority')}</span><strong>{matchResult.lotteryNumber}</strong></div><div><span>{t('pool.amountCharged')}</span><strong>{formatCurrency(matchResult.amountCharged)}</strong></div><div><span>{t('pool.authorization')}</span><strong>{t('pool.released')}</strong></div></div>
        <div className="notice"><Info size={21} aria-hidden="true" /><span>{t('pool.failureNotice')}</span></div>
      </section>
    )
  }

  return (
    <section className="content-page pool-page">
      <div className="pool-status"><CheckCircle size={30} weight="fill" aria-hidden="true" /><div><h1>{t('pool.waitingTitle')}</h1><p>{t('pool.waitingBody')}</p></div></div>
      <div className="countdown" aria-label={t('pool.countdownAria', { time })}><span>{t('pool.countdownTitle')}</span><strong>{time}</strong><small>{t('pool.today')}</small></div>
      <div className="pool-checks"><div><span>{t('pool.eligibility')}</span><strong>{t('review.verified')}</strong></div><div><span>{t('pool.roomPreferences')}</span><strong>{t('pool.submitted')}</strong></div><div><span>{t('pool.lifestyleProfile')}</span><strong>{t('pool.completed')}</strong></div><div><span>{t('pool.paymentAuthorization')}</span><strong>{t('pool.authorizationActive', { amount: formatCurrency(authorizationLimit) })}</strong></div></div>
      <div className="notice"><Info size={21} aria-hidden="true" /><span>{t('pool.fairnessNotice')}</span></div>
      <div className="pool-edit"><button type="button" onClick={onEdit}>{t('pool.reviewEdit')}</button><span>{t('pool.editDeadline')}</span></div>
      <div className="demo-panel">
        <div><strong>{t('pool.prototypeControls')}</strong><span>{t('pool.prototypeHelp')}</span></div>
        <div><PrimaryButton onClick={() => runMatch(MATCH_OUTCOME.SUCCESS)}>{t('pool.runSuccess')}</PrimaryButton><SecondaryButton onClick={() => runMatch(MATCH_OUTCOME.FAILED)}>{t('pool.previewFailure')}</SecondaryButton></div>
      </div>
    </section>
  )
}

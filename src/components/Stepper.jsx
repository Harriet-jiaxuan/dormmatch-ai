import {
  BedDouble,
  Check,
  FileCheck2,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'

const stepDefinitions = [
  { en: 'Eligibility', zh: '资格验证', icon: ShieldCheck },
  { en: 'Room Preferences', zh: '房型志愿', icon: BedDouble },
  { en: 'Lifestyle', zh: '生活习惯', icon: SlidersHorizontal },
  { en: 'Review & Authorize', zh: '确认与付款授权', icon: FileCheck2 },
  { en: 'Matching Pool', zh: '集中匹配', icon: UsersRound },
]

const statusLabels = {
  en: { complete: 'completed', current: 'current step', pending: 'not started', error: 'error', errorMessage: 'Verification failed' },
  zh: { complete: '已完成', current: '当前步骤', pending: '未开始', error: '错误', errorMessage: '验证失败' },
}

function StepIcon({ definition, complete, error }) {
  if (error) return <TriangleAlert size={19} strokeWidth={1.8} aria-hidden="true" />
  if (complete) return <Check size={19} strokeWidth={2.3} aria-hidden="true" />
  const Icon = definition.icon
  return <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
}

export function Stepper({ currentStep, onStepClick, locked, language = 'en', errorStep = null }) {
  const labels = statusLabels[language]
  const currentDefinition = stepDefinitions[currentStep - 1]
  const currentHasError = errorStep === currentStep

  return (
    <>
      <nav className="stepper-desktop" aria-label={language === 'zh' ? '申请进度' : 'Application progress'}>
        {stepDefinitions.map((definition, index) => {
          const step = index + 1
          const error = errorStep === step
          const complete = step < currentStep && !error
          const current = step === currentStep && !error
          const canVisit = !locked && complete
          const status = error ? labels.error : complete ? labels.complete : current ? labels.current : labels.pending
          const label = definition[language]

          return (
            <div className="stepper-item" key={definition.en}>
              <button
                className={`step-marker ${complete ? 'is-complete' : ''} ${current ? 'is-current' : ''} ${error ? 'is-error' : ''}`}
                type="button"
                onClick={() => canVisit && onStepClick(step)}
                disabled={!canVisit}
                aria-current={current || error ? 'step' : undefined}
                aria-invalid={error || undefined}
                aria-describedby={error ? `step-error-${step}` : undefined}
                aria-label={`${label}, ${status}`}
              >
                <StepIcon definition={definition} complete={complete} error={error} />
              </button>
              <span className={`step-label ${current ? 'is-current-label' : ''} ${error ? 'is-error-label' : ''}`}>{label}</span>
              {error && <span className="step-error-text" id={`step-error-${step}`}>{labels.errorMessage}</span>}
              {index < stepDefinitions.length - 1 && <span className={`step-line ${complete ? 'is-complete-line' : ''}`} aria-hidden="true" />}
            </div>
          )
        })}
      </nav>

      <nav className="stepper-mobile" aria-label={language === 'zh' ? '申请进度' : 'Application progress'}>
        <div className={`mobile-step-marker ${currentHasError ? 'is-error' : 'is-current'}`} aria-hidden="true">
          <StepIcon definition={currentDefinition} complete={false} error={currentHasError} />
        </div>
        <div className="mobile-step-copy">
          <span className="mobile-step-count">
            {language === 'zh' ? `第 ${currentStep} 步，共 5 步` : `Step ${currentStep} of 5`}
          </span>
          <strong className={currentHasError ? 'is-error-label' : ''}>{currentDefinition[language]}</strong>
          {currentHasError && <span className="mobile-step-error">{labels.errorMessage}</span>}
        </div>
        <div className="mobile-progress-track" aria-hidden="true">
          {stepDefinitions.map((definition, index) => {
            const step = index + 1
            const stateClass = errorStep === step ? 'is-error' : step <= currentStep ? 'is-active' : ''
            return <span className={stateClass} key={definition.en} />
          })}
        </div>
      </nav>
    </>
  )
}

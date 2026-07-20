import { useEffect, useRef, useState } from 'react'
import { Check, UsersThree } from '@phosphor-icons/react'
import { lifestyleQuestions, localizeAnswer, localizeQuestion } from '../data.js'
import { PageActions, PrimaryButton } from '../components/Controls.jsx'
import { useI18n } from '../i18n.js'

export function LifestyleStep({ answers, setAnswers, onBack, onComplete }) {
  const { language, t } = useI18n()
  const [phase, setPhase] = useState('intro')
  const [index, setIndex] = useState(0)
  const [error, setError] = useState('')
  const advanceTimer = useRef(null)
  const questionSource = lifestyleQuestions[index]
  const question = localizeQuestion(questionSource, language)

  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  const clearPendingAdvance = () => {
    window.clearTimeout(advanceTimer.current)
    advanceTimer.current = null
  }

  const advance = () => {
    if (index < lifestyleQuestions.length - 1) setIndex((current) => current + 1)
    else setPhase('summary')
  }

  const selectOption = (option) => {
    clearPendingAdvance()
    setAnswers((current) => ({ ...current, [questionSource.id]: option }))
    setError('')
    advanceTimer.current = window.setTimeout(advance, 220)
  }

  if (phase === 'intro') {
    return (
      <section className="narrow-page centered-status">
        <div className="status-symbol"><UsersThree size={35} aria-hidden="true" /></div>
        <h1>{t('lifestyle.introTitle')}</h1>
        <p>{t('lifestyle.introBody')}</p>
        <div className="inline-actions"><button className="button button-back" type="button" onClick={onBack}>{t('common.back')}</button><PrimaryButton onClick={() => setPhase('questions')}>{t('lifestyle.start')}</PrimaryButton></div>
      </section>
    )
  }

  if (phase === 'summary') {
    return (
      <section className="content-page">
        <div className="page-heading">
          <h1>{t('lifestyle.summaryTitle')}</h1>
          <p>{t('lifestyle.summaryBody')}</p>
        </div>
        <div className="answer-summary">
          {lifestyleQuestions.map((item) => <div key={item.id}><span>{localizeQuestion(item, language).question}</span><strong>{localizeAnswer(item, answers[item.id], language)}</strong></div>)}
        </div>
        <PageActions back={() => { setIndex(lifestyleQuestions.length - 1); setPhase('questions') }} next={onComplete} nextLabel={t('lifestyle.continueReview')} />
      </section>
    )
  }

  const next = () => {
    if (!questionSource.options.includes(answers[question.id])) {
      setError('lifestyle.chooseError')
      return
    }
    clearPendingAdvance()
    setError('')
    advance()
  }

  const back = () => {
    clearPendingAdvance()
    if (index > 0) setIndex((current) => current - 1)
    else setPhase('intro')
  }

  return (
    <section className="question-page">
      <div className="question-count">{t('lifestyle.questionCount', { current: index + 1, total: lifestyleQuestions.length })}</div>
      <h1>{question.question}</h1>
      <div className="option-list" role="radiogroup" aria-label={question.question}>
        {questionSource.options.map((option, optionIndex) => {
          const selected = answers[question.id] === option
          const optionLabel = language === 'zh' ? questionSource.optionsZh[optionIndex] : option
          return <button key={option} type="button" role="radio" aria-checked={selected} className={selected ? 'option is-selected' : 'option'} onClick={() => selectOption(option)}><span className="radio-mark">{selected && <Check size={17} weight="bold" />}</span><strong>{optionLabel}</strong></button>
        })}
      </div>
      {error && <p className="field-error" role="alert">{t(error)}</p>}
      <PageActions back={back} next={next} nextLabel={index === lifestyleQuestions.length - 1 ? t('lifestyle.reviewAnswers') : t('common.continue')} />
    </section>
  )
}

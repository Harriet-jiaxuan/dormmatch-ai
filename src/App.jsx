import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/AppShell.jsx'
import { createTranslator, I18nContext } from './i18n.js'
import { EligibilityStep } from './screens/EligibilityStep.jsx'
import { RoomPreferencesStep } from './screens/RoomPreferencesStep.jsx'
import { LifestyleStep } from './screens/LifestyleStep.jsx'
import { ReviewAuthorizeStep } from './screens/ReviewAuthorizeStep.jsx'
import { MatchingPoolStep } from './screens/MatchingPoolStep.jsx'
import { lifestyleQuestions } from './data.js'

const initialState = {
  currentStep: 1,
  eligibilityState: 'entry',
  roomChoices: {},
  roomOrder: [],
  lifestyleAnswers: {},
  authorizationLimit: 0,
}

function readSavedState() {
  try {
    const saved = window.localStorage.getItem('dormmatch-prototype-state')
    if (!saved) return initialState

    const parsed = JSON.parse(saved)
    const validAnswers = Object.fromEntries(
      lifestyleQuestions.flatMap((question) => question.options.includes(parsed.lifestyleAnswers?.[question.id])
        ? [[question.id, parsed.lifestyleAnswers[question.id]]]
        : []),
    )
    const hasCompleteLifestyle = lifestyleQuestions.every((question) => validAnswers[question.id])

    return {
      ...initialState,
      ...parsed,
      lifestyleAnswers: validAnswers,
      currentStep: parsed.currentStep > 3 && !hasCompleteLifestyle ? 3 : parsed.currentStep,
    }
  } catch {
    return initialState
  }
}

function readSavedLanguage() {
  try {
    return window.localStorage.getItem('dormmatch-language') === 'zh' ? 'zh' : 'en'
  } catch {
    return 'en'
  }
}

export default function App() {
  const [application, setApplication] = useState(readSavedState)
  const [language, setLanguage] = useState(readSavedLanguage)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.localStorage.setItem('dormmatch-prototype-state', JSON.stringify(application))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [application])

  useEffect(() => {
    window.localStorage.setItem('dormmatch-language', language)
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  const i18n = useMemo(() => ({ language, t: createTranslator(language) }), [language])

  const update = (changes) => setApplication((current) => ({ ...current, ...changes }))
  const goToStep = (step) => {
    if (!locked && step < application.currentStep) update({ currentStep: step })
  }
  const onLockChange = useCallback((value) => setLocked(value), [])

  let screen
  if (application.currentStep === 1) {
    screen = <EligibilityStep state={application.eligibilityState} setState={(eligibilityState) => update({ eligibilityState })} onComplete={() => update({ currentStep: 2, roomChoices: {}, roomOrder: [], lifestyleAnswers: {}, authorizationLimit: 0 })} />
  } else if (application.currentStep === 2) {
    screen = <RoomPreferencesStep choices={application.roomChoices} setChoices={(value) => setApplication((current) => ({ ...current, roomChoices: typeof value === 'function' ? value(current.roomChoices) : value }))} order={application.roomOrder} setOrder={(value) => setApplication((current) => ({ ...current, roomOrder: typeof value === 'function' ? value(current.roomOrder) : value }))} onComplete={() => update({ currentStep: 3 })} />
  } else if (application.currentStep === 3) {
    screen = <LifestyleStep answers={application.lifestyleAnswers} setAnswers={(value) => setApplication((current) => ({ ...current, lifestyleAnswers: typeof value === 'function' ? value(current.lifestyleAnswers) : value }))} onBack={() => update({ currentStep: 2 })} onComplete={() => update({ currentStep: 4 })} />
  } else if (application.currentStep === 4) {
    screen = <ReviewAuthorizeStep choices={application.roomChoices} order={application.roomOrder} answers={application.lifestyleAnswers} onBack={() => update({ currentStep: 3 })} editRooms={() => update({ currentStep: 2 })} editLifestyle={() => update({ currentStep: 3 })} onAuthorized={(authorizationLimit) => update({ authorizationLimit, currentStep: 5 })} />
  } else {
    screen = <MatchingPoolStep authorizationLimit={application.authorizationLimit} choices={application.roomChoices} order={application.roomOrder} answers={application.lifestyleAnswers} onEdit={() => update({ currentStep: 4 })} onLockChange={onLockChange} />
  }

  return (
    <I18nContext.Provider value={i18n}>
      <AppShell
        currentStep={application.currentStep}
        onStepClick={goToStep}
        locked={locked}
        language={language}
        onLanguageChange={setLanguage}
        errorStep={application.eligibilityState === 'error' ? 1 : null}
      >
        {screen}
      </AppShell>
    </I18nContext.Provider>
  )
}

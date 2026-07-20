import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Info, X } from '@phosphor-icons/react'
import { formatCurrency, localizeRoom, roomTypes } from '../data.js'
import { BackButton, PageActions, PrimaryButton, SecondaryButton } from '../components/Controls.jsx'
import { useI18n } from '../i18n.js'

export function RoomPreferencesStep({ choices, setChoices, order, setOrder, onComplete }) {
  const { language, t } = useI18n()
  const [phase, setPhase] = useState('cards')
  const [index, setIndex] = useState(0)
  const [error, setError] = useState('')
  const localizedRooms = useMemo(() => roomTypes.map((item) => localizeRoom(item, language)), [language])
  const room = localizedRooms[index]
  const accepted = useMemo(() => localizedRooms.filter((item) => choices[item.id] === 'accept'), [choices, localizedRooms])

  useEffect(() => {
    const imagePaths = new Set(roomTypes.map(({ image }) => image))
    imagePaths.forEach((image) => {
      const preload = new Image()
      preload.src = image
    })
  }, [])

  const choose = (value) => {
    setChoices((current) => ({ ...current, [room.id]: value }))
    setError('')
  }

  const nextCard = () => {
    if (!choices[room.id]) {
      setError('rooms.chooseError')
      return
    }
    if (index < roomTypes.length - 1) {
      setIndex((current) => current + 1)
      return
    }
    const acceptedNow = localizedRooms.filter((item) => choices[item.id] === 'accept')
    if (acceptedNow.length === 0) {
      setError('rooms.minimumError')
      return
    }
    const acceptedIds = acceptedNow.map((item) => item.id)
    setOrder((current) => [
      ...current.filter((id) => acceptedIds.includes(id)),
      ...acceptedIds.filter((id) => !current.includes(id)),
    ])
    setPhase(acceptedNow.length === 1 ? 'summary' : 'ranking')
  }

  const previousCard = () => {
    if (index > 0) {
      setIndex((current) => current - 1)
      setError('')
    }
  }

  const move = (id, direction) => {
    setOrder((current) => {
      const next = [...current]
      const from = next.indexOf(id)
      const to = from + direction
      if (to < 0 || to >= next.length) return current
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })
  }

  const activeOrder = order.filter((id) => accepted.some((item) => item.id === id))
  const orderedRooms = activeOrder.map((id) => localizedRooms.find((item) => item.id === id)).filter(Boolean)
  const maximum = accepted.length ? Math.max(...accepted.map((item) => item.price)) : 0

  if (phase === 'ranking') {
    return (
      <section className="content-page">
        <div className="page-heading">
          <h1>{t('rooms.rankingTitle')}</h1>
          <p>{t('rooms.rankingBody')}</p>
        </div>
        <ol className="ranking-list">
          {orderedRooms.map((item, position) => (
            <li key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
              event.preventDefault()
              const movedId = event.dataTransfer.getData('text/plain')
              const from = activeOrder.indexOf(movedId)
              const to = activeOrder.indexOf(item.id)
              if (from === -1 || to === -1 || from === to) return
              setOrder((current) => {
                const next = current.filter((id) => id !== movedId)
                const targetIndex = next.indexOf(item.id)
                next.splice(from < to ? targetIndex + 1 : targetIndex, 0, movedId)
                return next
              })
            }}>
              <span className="rank-number">{position + 1}</span>
              <div><strong>{item.name}</strong><span>{item.occupancy} / {formatCurrency(item.price)}</span></div>
              <div className="rank-actions">
                <button type="button" onClick={() => move(item.id, -1)} disabled={position === 0} aria-label={t('rooms.moveUp', { room: item.name })}><ArrowUp size={19} /></button>
                <button type="button" onClick={() => move(item.id, 1)} disabled={position === orderedRooms.length - 1} aria-label={t('rooms.moveDown', { room: item.name })}><ArrowDown size={19} /></button>
              </div>
            </li>
          ))}
        </ol>
        <div className="notice"><Info size={21} aria-hidden="true" /><span>{t('rooms.rankingNotice')}</span></div>
        <PageActions back={() => setPhase('cards')} next={() => setPhase('summary')} nextLabel={t('rooms.reviewPreferences')} />
      </section>
    )
  }

  if (phase === 'summary') {
    const summaryRooms = orderedRooms.length ? orderedRooms : accepted
    return (
      <section className="content-page">
        <div className="page-heading">
          <h1>{t('rooms.confirmTitle')}</h1>
          <p>{t('rooms.confirmBody')}</p>
        </div>
        <div className="summary-panel">
          <div className="summary-stat"><span>{t('rooms.acceptedCount')}</span><strong>{accepted.length}</strong></div>
          <div className="summary-stat"><span>{t('rooms.topPreference')}</span><strong>{summaryRooms[0]?.name}</strong></div>
          <div className="summary-stat"><span>{t('rooms.highestCharge')}</span><strong>{formatCurrency(maximum)}</strong></div>
        </div>
        <ol className="compact-order">
          {summaryRooms.map((item, position) => <li key={item.id}><span>{position + 1}</span><div><strong>{item.name}</strong><small>{item.occupancy} / {formatCurrency(item.price)}</small></div></li>)}
        </ol>
        <div className="page-actions">
          <BackButton onClick={() => setPhase(accepted.length > 1 ? 'ranking' : 'cards')} />
          <div className="action-right">
            <SecondaryButton onClick={() => { setIndex(0); setPhase('cards') }}>{t('rooms.edit')}</SecondaryButton>
            <PrimaryButton onClick={onComplete}>{t('rooms.continueLifestyle')}</PrimaryButton>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="room-page">
      <div className="page-heading centered-heading">
        <h1>{t('rooms.chooseTitle')}</h1>
        <p>{t('rooms.chooseBody')}</p>
      </div>
      <article className="room-card">
        <div className="room-image-frame">
          <img
            className="room-image"
            src={room.image}
            alt={room.imageAlt}
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="room-information">
          <p className="card-progress">{t('rooms.cardProgress', { current: index + 1, total: roomTypes.length })}</p>
          <h2>{room.name}</h2>
          <p>{room.occupancy} / {t('rooms.bedOptions', { bed: room.bed })}</p>
          <dl className="room-facts">
            <div><dt>{t('rooms.areaLabel')}</dt><dd>{room.area}</dd></div>
            <div><dt>{t('rooms.bathroomLabel')}</dt><dd>{room.bathroom}</dd></div>
          </dl>
          <p className="room-area-note">{t('rooms.areaEstimateNote')}</p>
          <strong className="room-price">{formatCurrency(room.price)}</strong>
          <span className="room-fee-note">{t('rooms.feeBasis')}</span>
          <fieldset className="choice-group">
            <legend>{t('rooms.acceptQuestion')}</legend>
            <button type="button" className={choices[room.id] === 'accept' ? 'choice is-selected' : 'choice'} onClick={() => choose('accept')}>
              <span className="choice-icon">{choices[room.id] === 'accept' ? <Check size={18} weight="bold" /> : null}</span>
              <span><strong>{t('rooms.acceptTitle')}</strong><small>{t('rooms.acceptHelp')}</small></span>
            </button>
            <button type="button" className={choices[room.id] === 'reject' ? 'choice is-selected' : 'choice'} onClick={() => choose('reject')}>
              <span className="choice-icon">{choices[room.id] === 'reject' ? <X size={18} weight="bold" /> : null}</span>
              <span><strong>{t('rooms.rejectTitle')}</strong><small>{t('rooms.rejectHelp')}</small></span>
            </button>
          </fieldset>
          {error && <p className="field-error" role="alert">{t(error)}</p>}
        </div>
      </article>
      <PageActions back={index > 0 ? previousCard : undefined} next={nextCard} nextLabel={index === roomTypes.length - 1 ? t('rooms.finish') : t('rooms.next')} />
    </section>
  )
}

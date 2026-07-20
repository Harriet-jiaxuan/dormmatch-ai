import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useI18n } from '../i18n.js'

export function PrimaryButton({ children, onClick, disabled, type = 'button', className = '' }) {
  return (
    <button className={`button button-primary ${className}`} type={type} onClick={onClick} disabled={disabled}>
      {children}
      <CaretRight size={18} weight="bold" aria-hidden="true" />
    </button>
  )
}

export function SecondaryButton({ children, onClick, disabled, type = 'button', className = '' }) {
  return (
    <button className={`button button-secondary ${className}`} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function BackButton({ children, onClick, disabled }) {
  const { t } = useI18n()
  return (
    <button className="button button-back" type="button" onClick={onClick} disabled={disabled}>
      <CaretLeft size={18} weight="bold" aria-hidden="true" />
      {children ?? t('common.back')}
    </button>
  )
}

export function PageActions({ back, next, nextLabel, nextDisabled = false, extra }) {
  const { t } = useI18n()
  return (
    <div className="page-actions">
      <div>{back && <BackButton onClick={back} />}</div>
      <div className="action-right">
        {extra}
        {next && <PrimaryButton onClick={next} disabled={nextDisabled}>{nextLabel ?? t('common.continue')}</PrimaryButton>}
      </div>
    </div>
  )
}

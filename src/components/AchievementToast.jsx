import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/language'
import { useT, pick } from '../i18n/strings'
import '../styles/achievement.css'

// 안내창이 떠 있는 시간 (밀리초)
const DURATION = 7000
// 사라지는 애니메이션 시간 (achievement.css와 맞춤)
const LEAVE_MS = 300

// 오른쪽 아래에서 올라오는 업적 안내창입니다.
// 받는 값:
// - achievement: { title, description }
// - onClose: 안내창이 완전히 사라진 뒤 실행
function AchievementToast({ achievement, onClose }) {
  const t = useT()
  const lang = useLanguage()
  const [isLeaving, setIsLeaving] = useState(false)

  // onClose는 화면이 다시 그려질 때마다 새로 만들어지므로 최신 것만 기억
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const timer = setTimeout(() => setIsLeaving(true), DURATION)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLeaving) return undefined
    const timer = setTimeout(() => onCloseRef.current(), LEAVE_MS)
    return () => clearTimeout(timer)
  }, [isLeaving])

  return (
    <div className={isLeaving ? 'ach-toast is-leaving' : 'ach-toast'} role="status" aria-live="polite">
      <div className="ach-icon" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24">
          <path
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="ach-text">
        <p className="ach-label">{t('achievement.unlocked')}</p>
        <p className="ach-title">{pick(achievement.title, lang)}</p>
        <p className="ach-body">{pick(achievement.description, lang)}</p>
      </div>

      <button
        type="button"
        className="ach-close"
        aria-label={t('achievement.close')}
        onClick={() => setIsLeaving(true)}
      >
        ×
      </button>

      <span className="ach-timer" style={{ animationDuration: `${DURATION}ms` }} aria-hidden="true" />
    </div>
  )
}

export default AchievementToast
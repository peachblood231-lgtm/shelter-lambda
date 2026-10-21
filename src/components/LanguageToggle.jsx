import { LANGUAGES, setLanguage, useLanguage } from '../i18n/language'
import { useT } from '../i18n/strings'
import '../styles/i18n.css'

const LABELS = { ko: 'KO', en: 'EN' }
// 화면 낭독기가 읽을 언어 이름 (각 언어로)
const NAMES = { ko: '한국어', en: 'English' }

// KO | EN 언어 전환 버튼
// - className: 위치용 클래스 (lang-toggle--intro / lang-toggle--readout)
function LanguageToggle({ className = '' }) {
  const lang = useLanguage()
  const t = useT()

  return (
    <div className={`lang-toggle ${className}`} role="group" aria-label={t('lang.label')}>
      {LANGUAGES.map((code, index) => (
        <span key={code} className="lang-toggle-item">
          {index > 0 && (
            <span className="lang-toggle-sep" aria-hidden="true">
              |
            </span>
          )}
          <button
            type="button"
            lang={code}
            className={code === lang ? 'lang-toggle-btn is-active' : 'lang-toggle-btn'}
            aria-pressed={code === lang}
            aria-label={NAMES[code]}
            onClick={() => setLanguage(code)}
          >
            {LABELS[code]}
          </button>
        </span>
      ))}
    </div>
  )
}

export default LanguageToggle
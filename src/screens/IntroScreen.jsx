import { useState } from 'react'
import LanguageToggle from '../components/LanguageToggle'
import { useT } from '../i18n/strings'

// public 폴더에 넣은 이미지 주소입니다.
// import.meta.env.BASE_URL을 앞에 붙여 두면 배포했을 때도 경로가 깨지지 않습니다.
const backgroundUrl = `${import.meta.env.BASE_URL}bg-concrete.jpg`
const emblemUrl = `${import.meta.env.BASE_URL}shelter-emblem.png`

// RESET DATA 버튼 위치: 화면 왼쪽 아래 구석에 고정
const RESET_BUTTON_STYLE = {
  position: 'fixed',
  left: 16,
  bottom: 16,
  color: '#ffffff',
}

// 메인화면(인트로).
// - onEnter: 대시보드로 넘어가기
// - onReset: 저장 기록을 처음으로 되돌리기
function IntroScreen({ onEnter, onReset }) {
  const t = useT()

  // 초기화를 방금 했는지 (버튼 글자로 알려 주기 위해)
  const [isResetDone, setIsResetDone] = useState(false)

  // RESET DATA 버튼: 한 번 더 물어본 뒤 초기화
  function handleReset() {
    const isConfirmed = window.confirm(t('intro.resetConfirm'))
    if (!isConfirmed) return

    onReset()
    setIsResetDone(true)
  }

  return (
    <div className="intro" style={{ backgroundImage: `url(${backgroundUrl})` }}>
      <section className="intro-card">
        {/* 상단 문구 (디자인 글자라 영어 그대로) */}
        <header className="intro-motto">
          <span>we</span>
          <span>are</span>
          <span>endure</span>
        </header>

        {/* 큰 제목 (영어 그대로) */}
        <h1 className="intro-title">
          LAMBDA -<br />
          SIMULATION
        </h1>

        {/* 시설 도면 이미지 */}
        <figure className="intro-emblem">
          <img src={emblemUrl} alt={t('intro.emblemAlt')} />
        </figure>

        {/* 시설 코드 (영어 그대로) */}
        <p className="intro-code">S - Lambda - 032</p>

        {/* 대시보드로 들어가기 */}
        <button type="button" className="intro-enter" onClick={onEnter}>
          <svg className="intro-arrow" width="52" height="12" viewBox="0 0 52 12" aria-hidden="true">
            <path d="M0 6H50M44 1l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          {t('intro.enter')}
        </button>

        {/* 카드 하단의 흰 막대 (장식) */}
        <div className="intro-bar" aria-hidden="true" />
      </section>

      {/* 저장 기록 초기화 (왼쪽 아래) */}
      <button type="button" className="term-back" style={RESET_BUTTON_STYLE} onClick={handleReset}>
        {isResetDone ? t('intro.resetDone') : t('intro.reset')}
      </button>

      {/* 언어 전환 (오른쪽 아래) */}
      <LanguageToggle className="lang-toggle--intro" />
    </div>
  )
}

export default IntroScreen
import { useState } from 'react'

// public 폴더에 넣은 이미지 주소입니다.
// import.meta.env.BASE_URL을 앞에 붙여 두면, 나중에 GitHub Pages에
// 배포했을 때도 경로가 깨지지 않습니다.
const backgroundUrl = `${import.meta.env.BASE_URL}bg-concrete.jpg`
const emblemUrl = `${import.meta.env.BASE_URL}shelter-emblem.png`

// RESET DATA 버튼 위치: 화면 왼쪽 아래 구석에 고정
// (기존 돌아가기 버튼 스타일 term-back을 재사용하고, 위치·색만 여기서 정함)
const RESET_BUTTON_STYLE = {
  position: 'fixed',
  left: 16,
  bottom: 16,
  color: '#ffffff',
}

// 메인화면(인트로).
// - onEnter: App에서 받은 "대시보드로 넘어가기" 함수
// - onReset: App에서 받은 "저장 기록을 처음으로 되돌리기" 함수
function IntroScreen({ onEnter, onReset }) {
  // 초기화를 방금 했는지 (버튼 글자를 바꿔서 알려 주기 위해)
  const [isResetDone, setIsResetDone] = useState(false)

  // RESET DATA 버튼: 한 번 더 물어본 뒤 초기화
  function handleReset() {
    const isConfirmed = window.confirm(
      '저장된 진행 기록(읽은 문서, 인벤토리, 복구도)을 모두 지우고 처음 상태로 되돌릴까요?',
    )
    if (!isConfirmed) return

    onReset()
    setIsResetDone(true)
  }

  return (
    <div className="intro" style={{ backgroundImage: `url(${backgroundUrl})` }}>
      <section className="intro-card">
        {/* 상단 문구: 세 단어를 양 끝과 가운데로 벌려 배치 */}
        <header className="intro-motto">
          <span>we</span>
          <span>are</span>
          <span>endure</span>
        </header>

        {/* 큰 제목: <br />로 두 줄로 나눕니다 */}
        <h1 className="intro-title">
          LAMBDA -<br />
          SIMULATION
        </h1>

        {/* 테두리 박스 안의 시설 도면 이미지 */}
        <figure className="intro-emblem">
          <img src={emblemUrl} alt="Shelter Lambda 시설 도면" />
        </figure>

        {/* 시설 코드: 글자 간격을 넓게 벌려 표시 */}
        <p className="intro-code">S - Lambda - 032</p>

        {/* 클릭하면 onEnter가 실행되어 대시보드로 넘어갑니다 */}
        <button type="button" className="intro-enter" onClick={onEnter}>
          <svg className="intro-arrow" width="52" height="12" viewBox="0 0 52 12" aria-hidden="true">
            <path d="M0 6H50M44 1l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
          Enter the SHELTER
        </button>

        {/* 카드 하단의 흰 막대 (장식) */}
        <div className="intro-bar" aria-hidden="true" />
      </section>

      {/* 저장 기록 초기화 버튼 (테스트용, 왼쪽 아래 구석) */}
      <button type="button" className="term-back" style={RESET_BUTTON_STYLE} onClick={handleReset}>
        {isResetDone ? 'SAVE DATA CLEARED' : 'RESET DATA'}
      </button>
    </div>
  )
}

export default IntroScreen
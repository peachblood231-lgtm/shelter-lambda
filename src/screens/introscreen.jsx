// public 폴더에 넣은 이미지 주소입니다.
// import.meta.env.BASE_URL을 앞에 붙여 두면, 나중에 GitHub Pages에
// 배포했을 때도 경로가 깨지지 않습니다.
const backgroundUrl = `${import.meta.env.BASE_URL}bg-concrete.jpg`
const emblemUrl = `${import.meta.env.BASE_URL}shelter-emblem.png`

// 메인화면(인트로). onEnter는 App에서 받은 "대시보드로 넘어가기" 함수입니다.
function IntroScreen({ onEnter }) {
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
    </div>
  )
}

export default IntroScreen
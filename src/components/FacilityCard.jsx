import { useT } from '../i18n/strings'

// 시설 카드 하나입니다. 누르면 onOpen이 실행됩니다.
// 받는 값:
// - name: 시설 이름 (영어 그대로)
// - access: 출입 상태 ('accessible' 또는 'restricted')
// - onOpen: 눌렀을 때 실행할 함수
function FacilityCard({ name, access, onOpen }) {
  const t = useT()

  // 출입 제한 시설이면 잠금 상태: 호버는 되지만 눌러도 열리지 않음
  const isLocked = access === 'restricted'

  // 상태에 따라 클래스 이름을 붙입니다. (CSS에서 호버 색상을 다르게)
  const className = `term-card term-card--${access}`

  return (
    <button
      type="button"
      className={className}
      onClick={isLocked ? undefined : onOpen}
      aria-disabled={isLocked ? 'true' : undefined}
      style={isLocked ? { cursor: 'not-allowed' } : undefined}
    >
      <span className="term-card-name">{name}</span>

      {/* 오른쪽 위 ↗ 화살표 */}
      <svg className="term-card-arrow" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M3 25L25 3M9 3h16v16" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* 오른쪽 아래 큰 글자: 평소에는 숨어 있다가 호버하면 나타남 */}
      <span className="term-card-access">{t(`facility.${access}`)}</span>
    </button>
  )
}

export default FacilityCard
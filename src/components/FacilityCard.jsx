// 출입 상태별로 화면에 보여 줄 큰 글자
const ACCESS_LABELS = {
  accessible: 'ACCESSIBLE',
  restricted: 'RESTRICTED',
}

// 시설 카드 하나입니다. 누르면 onOpen이 실행됩니다.
// 받는 값:
// - name: 시설 이름
// - access: 출입 상태 ('accessible' 또는 'restricted')
// - onOpen: 눌렀을 때 실행할 함수
function FacilityCard({ name, access, onOpen }) {
  // 출입 제한 시설이면 잠금 상태: 호버는 되지만 눌러도 열리지 않음
  // (7단계에서 access가 'accessible'로 바뀌면 자동으로 열 수 있게 됨)
  const isLocked = access === 'restricted'

  // 상태에 따라 클래스 이름을 붙입니다.
  // 예: access가 'restricted'면 → "term-card term-card--restricted"
  // CSS에서 이 클래스 이름으로 호버 색상을 다르게 정합니다.
  const className = `term-card term-card--${access}`

  return (
    <button
      type="button"
      className={className}
      // 잠금 상태면 클릭해도 아무 일도 하지 않음
      onClick={isLocked ? undefined : onOpen}
      // 화면 낭독기에 "누를 수 없는 버튼"이라고 알려 줌
      // (disabled 대신 이걸 쓰는 이유: disabled면 호버와 Tab 이동까지 막히기 때문)
      aria-disabled={isLocked ? 'true' : undefined}
      // 잠금 상태면 마우스 모양을 🚫(금지)로
      style={isLocked ? { cursor: 'not-allowed' } : undefined}
    >
      <span className="term-card-name">{name}</span>

      {/* 오른쪽 위 ↗ 화살표 */}
      <svg className="term-card-arrow" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M3 25L25 3M9 3h16v16" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* 오른쪽 아래 큰 글자: 평소에는 숨어 있다가 호버하면 나타남 */}
      <span className="term-card-access">{ACCESS_LABELS[access]}</span>
    </button>
  )
}

export default FacilityCard
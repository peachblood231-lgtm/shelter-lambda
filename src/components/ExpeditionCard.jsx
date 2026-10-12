// 오른쪽 열의 파란색 EXPEDITION(탐사) 카드입니다. 누르면 onOpen이 실행됩니다.
// 흰색 카드와 같은 모양(term-control)에 파란색 꾸밈(term-control--expedition)을 더했습니다.
function ExpeditionCard({ onOpen }) {
  return (
    <button type="button" className="term-control term-control--expedition" onClick={onOpen}>
      <span className="term-control-name">EXPEDITION</span>

      {/* 오른쪽 위 ↗ 화살표 */}
      <svg className="term-control-arrow" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M3 25L25 3M9 3h16v16" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  )
}

export default ExpeditionCard
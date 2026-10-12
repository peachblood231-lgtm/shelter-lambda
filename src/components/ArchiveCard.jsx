// 오른쪽 열 맨 아래 흰색 ARCHIVE 카드입니다. 누르면 onOpen이 실행됩니다.
// 모양은 중앙제어시스템 카드와 같은 스타일(term-control)을 씁니다.
function ArchiveCard({ onOpen }) {
  return (
    <button type="button" className="term-control" onClick={onOpen}>
      <span className="term-control-name">ARCHIVE</span>

      {/* 오른쪽 위 ↗ 화살표 */}
      <svg className="term-control-arrow" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M3 25L25 3M9 3h16v16" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  )
}

export default ArchiveCard
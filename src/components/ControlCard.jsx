// 오른쪽 위 흰색 "중앙제어시스템" 카드입니다. 누르면 onOpen이 실행됩니다.
function ControlCard({ onOpen }) {
  return (
    <button type="button" className="term-control" onClick={onOpen}>
      {/* <br />로 디자인처럼 세 줄로 나눕니다 */}
      <span className="term-control-name">
        CENTRAL
        <br />
        TEMPERATURE
        <br />
        CONTROL SYSTEM
      </span>

      {/* 오른쪽 위 ↗ 화살표 */}
      <svg className="term-control-arrow" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M3 25L25 3M9 3h16v16" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  )
}

export default ControlCard
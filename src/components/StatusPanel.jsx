import { formatTemp } from '../utils/format'

// 화면 오른쪽 위 구석의 작은 상태 표시입니다.
// 받는 값:
// - status: DashboardScreen의 STATUS 객체 (주민 수, 구역 목록)
// - inside / outside: 지금 온도 숫자 (DashboardScreen에서 한 번만 계산해서 넘겨줌)
function StatusPanel({ status, inside, outside }) {
  return (
    <aside className="term-readout" aria-label="시설 상태">
      {/* dl: 이름(dt)과 값(dd)을 짝지어 보여 주는 목록 */}
      <dl className="term-readout-list">
        <div className="term-readout-row">
          <dt>INSIDE</dt>
          <dd>{formatTemp(inside)}</dd>
        </div>
        <div className="term-readout-row">
          <dt>OUTSIDE</dt>
          <dd>{formatTemp(outside)}</dd>
        </div>
        <div className="term-readout-row">
          <dt>CURRENT RESIDENTS</dt>
          <dd>{status.residents}</dd>
        </div>

        {/* 구역 목록: 더 작은 글씨 */}
        {status.sectors.map((sector) => (
          <div key={sector} className="term-readout-row term-readout-row--small">
            <dt>{sector}</dt>
            <dd aria-label="신호 없음">···</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}

export default StatusPanel
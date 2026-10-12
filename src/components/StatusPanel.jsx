import useFluctuatingValue from '../hooks/useFluctuatingValue'

// 숫자를 "12.4 °C" 형태의 글자로 바꿉니다.
// toFixed(1): 항상 소수점 한 자리로 표시 (예: 12 → "12.0")
function formatTemp(value) {
  return `${value.toFixed(1)} °C`
}

// 화면 오른쪽 위 구석의 작은 상태 표시입니다.
// 받는 값: status (DashboardScreen의 STATUS 객체)
function StatusPanel({ status }) {
  // 일정 시간마다 랜덤하게 바뀌는 온도 두 개
  const inside = useFluctuatingValue(status.inside.base, status.inside.range, status.tempUpdateMs)
  const outside = useFluctuatingValue(status.outside.base, status.outside.range, status.tempUpdateMs)

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
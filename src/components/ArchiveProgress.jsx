// 아카이브 화면 오른쪽 열의 진행 패널입니다.
// 받는 값: stats (getArchiveStats로 계산한 개수)
// 5-3단계에서 "읽은 기록 수", 진행 바, NEXT LEAD가 추가될 예정입니다.
function ArchiveProgress({ stats }) {
  // [이름, 숫자] 짝으로 정리해 두고 반복해서 그립니다.
  const rows = [
    ['TOTAL RECORDS', stats.total],
    ['RECOVERED', stats.recovered],
    ['PARTIAL', stats.partial],
    ['CORRUPTED', stats.corrupted],
    ['LOCKED', stats.locked],
  ]

  return (
    <section className="arc-progress" aria-labelledby="arc-progress-title">
      <h2 id="arc-progress-title" className="term-log-title">
        ARCHIVE PROGRESS
      </h2>
      <dl className="arc-progress-list">
        {rows.map(([label, value]) => (
          <div key={label} className="arc-progress-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default ArchiveProgress
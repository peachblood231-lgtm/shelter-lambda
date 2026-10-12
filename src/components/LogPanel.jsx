// CURRENT LOG 패널입니다. 기록 목록을 위에서부터 보여 줍니다.
// 받는 값: logs (각 기록은 { time, text } 형태)
function LogPanel({ logs }) {
  return (
    <section className="term-log" aria-labelledby="current-log-title">
      <h2 id="current-log-title" className="term-log-title">
        CURRENT LOG
      </h2>

      {/* 기록이 많아지면 이 목록 안에서만 스크롤됩니다 */}
      <ol className="term-log-list">
        {logs.map((log, index) => (
          <li key={index}>
            <span className="term-log-time">{log.time}</span>
            {log.text}
          </li>
        ))}
      </ol>
    </section>
  )
}

export default LogPanel
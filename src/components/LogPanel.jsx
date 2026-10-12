import { useEffect, useRef } from 'react'
// 로그 전용 스타일 (스크롤바 숨김)
import '../styles/log.css'

// CURRENT LOG 패널입니다. 기록 목록을 위에서부터 보여 줍니다.
// 받는 값: logs (각 기록은 { time, text } 형태)
function LogPanel({ logs }) {
  // 목록을 가리키는 손잡이(ref)
  const listRef = useRef(null)

  // 기록 개수가 바뀌면(새 기록이 생기면) 맨 아래 = 최신 기록으로 스크롤
  // (스크롤바가 없어서 최신 기록을 놓치지 않게)
  useEffect(() => {
    const list = listRef.current
    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, [logs.length])

  return (
    <section className="term-log" aria-labelledby="current-log-title">
      <h2 id="current-log-title" className="term-log-title">
        CURRENT LOG
      </h2>

      {/* 기록이 많아지면 이 안에서만 스크롤됩니다 (휠·트랙패드) */}
      <ol ref={listRef} className="term-log-list">
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
import RecordBody from './RecordBody'

// 오른쪽 상세 패널입니다. 선택한 기록의 내용을 보여 줍니다.
// 받는 값:
// - record: 선택한 기록
// - status: 상태 글자 (RECOVERED / PARTIAL / LOCKED / CORRUPTED)
// - related: 관련 기록 목록 [{ id, title, external, state 또는 facility }]
// - readIds: 지금까지 읽은 기록 ID 목록 (해금 조건 표시용)
// - onSelect: 다른 기록으로 이동할 때 실행할 함수
function RecordDetail({ record, status, related, readIds, onSelect }) {
  // 손상된 기록: 내용 없이 오류 문구만
  if (status === 'CORRUPTED') {
    return (
      <article className="arc-detail arc-detail--corrupted">
        <p className="arc-detail-id">{record.id}</p>
        <p className="arc-detail-error">DATA NOT RECOVERABLE — SECTOR CHECKSUM FAILED</p>
      </article>
    )
  }

  // 잠긴 기록: 제목과 해금 조건 목록 (본문은 숨김)
  if (status === 'LOCKED') {
    return (
      <article className="arc-detail arc-detail--locked">
        <p className="arc-detail-id">
          {record.id} · {record.category}
        </p>
        <h2 className="arc-detail-title">{record.title}</h2>
        <p className="arc-detail-error">{record.unlock.message}</p>

        {/* 해금 조건: 읽어야 하는 기록과 지금 상태 */}
        <ul className="arc-requires">
          {record.unlock.requires.map((id) => {
            const isDone = readIds.includes(id)
            return (
              <li key={id}>
                {/* 누르면 그 기록으로 이동 */}
                <button type="button" className="arc-requires-link" onClick={() => onSelect(id)}>
                  {id}
                </button>
                <span className={isDone ? 'arc-requires-state is-done' : 'arc-requires-state is-pending'}>
                  {isDone ? 'VERIFIED' : 'NOT REVIEWED'}
                </span>
              </li>
            )
          })}
        </ul>
      </article>
    )
  }

  // 열람 가능한 기록
  return (
    <article className="arc-detail" aria-labelledby="arc-detail-title">
      <p className="arc-detail-id">
        {record.id} · {record.category}
      </p>
      <h2 id="arc-detail-title" className="arc-detail-title">
        {record.title}
      </h2>

      {/* 작성자 / 날짜 / 문서 상태 */}
      <dl className="arc-detail-meta">
        <div>
          <dt>AUTHOR</dt>
          <dd>{record.author}</dd>
        </div>
        <div>
          <dt>DATE</dt>
          <dd>{record.date}</dd>
        </div>
        <div>
          <dt>INTEGRITY</dt>
          <dd className={`arc-status--${status.toLowerCase()}`}>{status}</dd>
        </div>
      </dl>

      {/* 문서 본문 */}
      <div className="arc-doc">
        <RecordBody blocks={record.blocks} />
      </div>

      {/* 손상·누락 정보 (있을 때만) */}
      {record.missing && (
        <section className="arc-missing">
          <h3>MISSING DATA</h3>
          <p>{record.missing}</p>
        </section>
      )}

      {/* 관련 기록과 시설 */}
      <section className="arc-related">
        <h3>RELATED RECORDS</h3>
        <ul>
          {related.map((item) => (
            <li key={item.id}>
              {item.external ? (
                // 다른 시설의 기록: 아직 이 터미널에서 볼 수 없음 (누를 수 없음)
                <div className="arc-related-item is-external">
                  <span className="arc-related-id">{item.id}</span>
                  <span className="arc-related-title">{item.title}</span>
                  <span className="arc-related-state">{item.facility} — NOT AVAILABLE ON THIS TERMINAL</span>
                </div>
              ) : (
                // 이 시설의 기록: 누르면 그 기록으로 이동
                <button type="button" className="arc-related-item" onClick={() => onSelect(item.id)}>
                  <span className="arc-related-id">{item.id}</span>
                  <span className="arc-related-title">{item.title}</span>
                  <span className={`arc-related-state is-${item.state.toLowerCase()}`}>{item.state}</span>
                </button>
              )}
            </li>
          ))}
        </ul>

        <h3>RELATED FACILITY</h3>
        <p>{record.relatedFacilities.join(' / ')}</p>
      </section>
    </article>
  )
}

export default RecordDetail
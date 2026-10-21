import { useEffect, useRef, useState } from 'react'
import RecordDetail from './RecordDetail'
import { getRecordStatus, isLocked } from '../utils/archiveStats'
import { useT } from '../i18n/strings'

// 분류 탭 순서 (기록이 있는 분류만 탭으로 보여 줌)
const CATEGORY_ORDER = ['DISTRIBUTION', 'INVENTORY', 'INCIDENT', 'PERSONAL']

// 아카이브 화면의 가운데 내용입니다. 왼쪽 목록 + 오른쪽 상세 패널.
// 받는 값:
// - records: 이 시설의 기록 목록
// - external: 다른 시설 기록 목록 (관련 기록 표시용)
// - readIds: 지금까지 읽은 기록 ID 목록
// - onRead: 기록을 읽었을 때 실행할 함수 (읽은 목록에 추가)
function ArchiveView({ records, external, readIds, onRead }) {
  const t = useT()

  // 기록이 하나라도 있는 분류만 골라 탭으로 만듭니다.
  const categories = CATEGORY_ORDER.filter((category) =>
    records.some((record) => record.category === category),
  )

  // 지금 선택한 분류 탭 ('ALL'이면 전체)
  const [filter, setFilter] = useState('ALL')

  // 지금 선택한 기록의 ID. 처음에는 손상되지 않은 첫 기록.
  const [selectedId, setSelectedId] = useState(
    () => records.find((record) => record.integrity !== 'CORRUPTED')?.id ?? null,
  )

  // 방금 해금된 기록 ID (초록 알림 줄에 보여 줌)
  const [grantedId, setGrantedId] = useState(null)

  // 탭에 맞는 기록만 남깁니다. (분류 탭에서는 손상 기록이 빠짐)
  const visibleRecords =
    filter === 'ALL' ? records : records.filter((record) => record.category === filter)

  const selected = records.find((record) => record.id === selectedId)
  const selectedStatus = selected ? getRecordStatus(selected, readIds) : null

  // ── 읽음 기록 ──
  // 선택한 기록이 열람 가능하면(손상·잠김이 아니면) 읽은 목록에 추가합니다.
  useEffect(() => {
    if (!selected) return
    if (selectedStatus === 'CORRUPTED' || selectedStatus === 'LOCKED') return
    if (!readIds.includes(selected.id)) {
      onRead(selected.id)
    }
  }, [selected, selectedStatus, readIds, onRead])

  // ── 해금 감지 ──
  // 지금 잠겨 있는 기록 ID들을 "DH-014,DH-020" 같은 글자로 만들어 둡니다.
  const lockedKey = records
    .filter((record) => record.integrity !== 'CORRUPTED' && isLocked(record, readIds))
    .map((record) => record.id)
    .join(',')

  // 바로 전에 잠겨 있던 목록을 기억해 두는 곳
  const previousLockedRef = useRef(lockedKey)

  // 잠긴 목록이 바뀌면: 전에는 잠겨 있었는데 지금은 아닌 기록 = 방금 해금된 기록
  useEffect(() => {
    const before = previousLockedRef.current.split(',').filter(Boolean)
    const now = lockedKey.split(',').filter(Boolean)
    previousLockedRef.current = lockedKey

    const openedId = before.find((id) => !now.includes(id))
    if (openedId) {
      setGrantedId(openedId)
    }
  }, [lockedKey])

  // ── 기록 선택 (목록·관련 기록·해금 조건·알림 줄에서 공통으로 사용) ──
  function selectRecord(id) {
    const target = records.find((record) => record.id === id)
    if (!target) return

    setSelectedId(id)

    // 지금 탭에서 안 보이는 기록이면 탭을 ALL로 바꿔서 목록에도 보이게
    if (filter !== 'ALL' && target.category !== filter) {
      setFilter('ALL')
    }

    // 해금 알림 속 기록을 열었으면 알림을 지움
    if (id === grantedId) {
      setGrantedId(null)
    }
  }

  // 관련 기록 ID 하나를 화면에 보여 줄 정보로 바꿉니다.
  function describeRelated(id) {
    // 1) 이 시설의 기록인지
    const own = records.find((record) => record.id === id)
    if (own) {
      const status = getRecordStatus(own, readIds)
      let state = readIds.includes(id) ? 'READ' : 'UNREAD'
      if (status === 'LOCKED') state = 'LOCKED'
      if (status === 'CORRUPTED') state = 'CORRUPTED'
      return { id, title: own.title ?? t('archive.dataLost'), external: false, state }
    }

    // 2) 다른 시설의 기록인지
    const other = external.find((record) => record.id === id)
    if (other) {
      return { id, title: other.title, facility: other.facility, external: true }
    }

    // 3) 어디에도 없는 ID (데이터 오타 등)
    return { id, title: t('archive.unknown'), facility: 'UNKNOWN', external: true }
  }

  const grantedRecord = records.find((record) => record.id === grantedId)

  return (
    <div className="arc">
      {/* ── 왼쪽: 분류 탭 + 해금 알림 + 기록 목록 ── */}
      <section className="arc-index" aria-label={t('archive.index')}>
        <div className="arc-tabs" role="group" aria-label={t('archive.filter')}>
          {['ALL', ...categories].map((category) => (
            <button
              key={category}
              type="button"
              className={category === filter ? 'arc-tab is-active' : 'arc-tab'}
              aria-pressed={category === filter}
              onClick={() => setFilter(category)}
            >
              {t(`archive.cat.${category}`)}
            </button>
          ))}
        </div>

        {/* 해금 알림 (role="status": 화면 낭독기가 알림을 읽어 줌) */}
        <div role="status">
          {grantedRecord && (
            <button type="button" className="arc-granted" onClick={() => selectRecord(grantedRecord.id)}>
              {t('archive.granted', { id: grantedRecord.id, title: grantedRecord.title })}
            </button>
          )}
        </div>

        <ul className="arc-list">
          {visibleRecords.map((record) => {
            const status = getRecordStatus(record, readIds)
            const isCorrupted = status === 'CORRUPTED'
            const isSelected = record.id === selectedId

            // 클래스 이름 조립: 선택됨, 손상됨 표시
            let className = 'arc-item'
            if (isSelected) className += ' is-selected'
            if (isCorrupted) className += ' is-corrupted'

            return (
              <li key={record.id}>
                <button
                  type="button"
                  className={className}
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => selectRecord(record.id)}
                >
                  <span className="arc-item-top">
                    <span>{record.id}</span>
                    <span className={`arc-status arc-status--${status.toLowerCase()}`}>
                      {t(`archive.status.${status}`)}
                    </span>
                  </span>
                  <span className="arc-item-title">{isCorrupted ? t('archive.dataLost') : record.title}</span>
                  {!isCorrupted && (
                    <span className="arc-item-meta">
                      {t(`archive.cat.${record.category}`)} · {record.date}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── 오른쪽: 상세 패널 ──
          key가 바뀌면 패널을 새로 그려서 스크롤이 맨 위로 가고, 나타나는 효과도 다시 실행됨 */}
      {selected ? (
        <RecordDetail
          key={selected.id}
          record={selected}
          status={selectedStatus}
          related={(selected.related ?? []).map(describeRelated)}
          readIds={readIds}
          onSelect={selectRecord}
        />
      ) : (
        <div className="arc-detail" />
      )}
    </div>
  )
}

export default ArchiveView
// 아카이브 기록에 관한 계산을 모아 둔 파일입니다.
// 여러 화면(목록, 상세, 진행 패널, 헤더)에서 같이 씁니다.
//
// readIds: 플레이어가 지금까지 읽은 기록 ID 목록 (예: ['DH-001', 'DH-003'])

// 잠긴 기록인지 확인합니다.
// 해금 조건(unlock.requires)에 적힌 기록을 "모두" 읽었으면 열림, 하나라도 안 읽었으면 잠김.
export function isLocked(record, readIds = []) {
  if (!record.unlock) return false
  const allRead = record.unlock.requires.every((id) => readIds.includes(id))
  return !allRead
}

// 목록과 상세 패널에 보여 줄 상태 글자를 정합니다.
// 손상 > 잠김 > 문서 상태(RECOVERED / PARTIAL) 순서로 우선합니다.
export function getRecordStatus(record, readIds = []) {
  if (record.integrity === 'CORRUPTED') return 'CORRUPTED'
  if (isLocked(record, readIds)) return 'LOCKED'
  return record.integrity
}

// 기록 목록에서 개수를 계산합니다.
export function getArchiveStats(records, readIds = []) {
  // filter(...).length: 조건에 맞는 기록이 몇 개인지 셉니다.
  const countBy = (check) => records.filter(check).length

  return {
    total: records.length,
    recovered: countBy((record) => record.integrity === 'RECOVERED'),
    partial: countBy((record) => record.integrity === 'PARTIAL'),
    corrupted: countBy((record) => record.integrity === 'CORRUPTED'),
    locked: countBy((record) => record.integrity !== 'CORRUPTED' && isLocked(record, readIds)),
    // 읽은 기록 수 (5-3단계 진행률에서 사용)
    read: countBy((record) => readIds.includes(record.id)),
  }
}
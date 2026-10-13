// SECTOR 방 배치 장난감의 규칙입니다.
// 방(블록) 하나: { id, kind(종류 0~2, 화면엔 1~3), x, y(왼쪽 위 칸), w, h(차지하는 칸 수), lit(선택) }
// 방은 상하좌우 한 방향으로만 미끄러지고, 다른 방을 뛰어넘을 수 없습니다.

// 방향 → 한 칸 움직임
export const DIRS = {
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
}

// 처음 배치: 빈 칸들을 섞은 뒤, 종류별 개수(counts)만큼 1×1 방을 놓음
// 예: counts [8, 8, 6] → 1번 방 8개, 2번 방 8개, 3번 방 6개
export function createLayout({ cols, rows, counts }) {
  const cells = []
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      cells.push({ x, y })
    }
  }

  // 칸 순서를 무작위로 섞기
  for (let i = cells.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }

  const blocks = []
  let id = 1
  let index = 0
  counts.forEach((count, kind) => {
    for (let n = 0; n < count && index < cells.length; n += 1) {
      const cell = cells[index]
      index += 1
      blocks.push({ id, kind, x: cell.x, y: cell.y, w: 1, h: 1, lit: false })
      id += 1
    }
  })
  return blocks
}

// 두 영역이 겹치는지
function overlaps(block, x, y, w, h) {
  return block.x < x + w && block.x + block.w > x && block.y < y + h && block.y + block.h > y
}

// (x, y) 칸을 차지한 방 찾기 (excludeId 방은 빼고)
export function blockAt(blocks, x, y, excludeId) {
  return blocks.find((block) => block.id !== excludeId && overlaps(block, x, y, 1, 1)) ?? null
}

// 이 영역이 격자 안이고 비어 있는지 (excludeIds 방은 없는 셈 침)
export function isAreaFree(blocks, x, y, w, h, cols, rows, excludeIds = []) {
  if (x < 0 || y < 0 || x + w > cols || y + h > rows) return false
  return !blocks.some((block) => !excludeIds.includes(block.id) && overlaps(block, x, y, w, h))
}

// 한 방향으로 몇 칸까지 미끄러질 수 있는지, 그리고 바로 앞을 막은 방과 합칠 수 있는지
// 돌려주는 값: { steps, blocker, canMerge }
export function getSlide(blocks, id, dir, cols, rows) {
  const block = blocks.find((item) => item.id === id)
  if (!block) return { steps: 0, blocker: null, canMerge: false }
  const { dx, dy } = DIRS[dir]

  // 빈 칸이 계속되는 동안 한 칸씩
  let steps = 0
  while (isAreaFree(blocks, block.x + dx * (steps + 1), block.y + dy * (steps + 1), block.w, block.h, cols, rows, [id])) {
    steps += 1
  }

  // 바로 다음 칸을 막은 방 (격자 끝이면 없음)
  const nextX = block.x + dx * (steps + 1)
  const nextY = block.y + dy * (steps + 1)
  const isInside = nextX >= 0 && nextY >= 0 && nextX + block.w <= cols && nextY + block.h <= rows
  const blocker = isInside
    ? blocks.find((item) => item.id !== id && overlaps(item, nextX, nextY, block.w, block.h)) ?? null
    : null

  // 합칠 수 있는지: 같은 종류 + 줄이 딱 맞음 (합친 모양이 직사각형)
  let canMerge = false
  if (blocker && blocker.kind === block.kind) {
    if (dx !== 0) canMerge = blocker.y === block.y && blocker.h === block.h
    else canMerge = blocker.x === block.x && blocker.w === block.w
  }

  return { steps, blocker, canMerge }
}

// 한 방향으로 wantSteps칸 미끄러뜨리기
// - 빈 칸까지만 감 (뛰어넘기 불가)
// - 막은 방보다 더 가려고 했고 합칠 수 있으면 → 합치기
// 돌려주는 값: { blocks, type: 'move' | 'merge', targetId, axis } / 아무 변화 없으면 null
export function slideBlock(blocks, id, dir, wantSteps, cols, rows) {
  const block = blocks.find((item) => item.id === id)
  if (!block) return null
  const { dx, dy } = DIRS[dir]
  const slide = getSlide(blocks, id, dir, cols, rows)

  // 합치기: 막은 방에 붙어서 하나로
  if (wantSteps > slide.steps && slide.canMerge) {
    const target = slide.blocker
    const sx = block.x + dx * slide.steps
    const sy = block.y + dy * slide.steps
    const left = Math.min(sx, target.x)
    const top = Math.min(sy, target.y)
    const right = Math.max(sx + block.w, target.x + target.w)
    const bottom = Math.max(sy + block.h, target.y + target.h)
    const merged = { ...target, x: left, y: top, w: right - left, h: bottom - top, lit: target.lit || block.lit }

    return {
      blocks: blocks.filter((item) => item.id !== id).map((item) => (item.id === target.id ? merged : item)),
      type: 'merge',
      targetId: target.id,
      axis: dx !== 0 ? 'h' : 'v',
    }
  }

  // 이동: 갈 수 있는 만큼만
  const steps = Math.min(wantSteps, slide.steps)
  if (steps <= 0) return null
  return {
    blocks: blocks.map((item) => (item.id === id ? { ...item, x: item.x + dx * steps, y: item.y + dy * steps } : item)),
    type: 'move',
    targetId: id,
    axis: dx !== 0 ? 'h' : 'v',
  }
}

// 선택 켜기/끄기
export function toggleLit(blocks, id) {
  return blocks.map((item) => (item.id === id ? { ...item, lit: !item.lit } : item))
}
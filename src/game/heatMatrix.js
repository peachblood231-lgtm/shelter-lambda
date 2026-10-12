// 열 분배 매트릭스 퍼즐 규칙입니다.
// 칸 상태는 true = WARM, false = COLD 로 나타냅니다.
// 칸 번호는 왼쪽 위부터 0, 1, 2, ... (4×4면 0~15)

// 모든 칸이 WARM인 판
export function createSolvedGrid(size) {
  return Array.from({ length: size * size }, () => true)
}

// index 칸을 누른 결과: 그 칸과 위·아래·왼쪽·오른쪽 칸이 뒤집힘
export function toggleCell(grid, size, index) {
  const next = [...grid]
  const row = Math.floor(index / size)
  const col = index % size
  const targets = [
    [row, col],
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ]

  for (const [r, c] of targets) {
    // 판 밖은 건너뜀
    if (r >= 0 && r < size && c >= 0 && c < size) {
      const i = r * size + c
      next[i] = !next[i]
    }
  }
  return next
}

// 모든 칸이 WARM이면 성공
export function isSolved(grid) {
  return grid.every(Boolean)
}

// WARM 칸 개수
export function countWarm(grid) {
  return grid.filter(Boolean).length
}

// 문제 만들기: 다 풀린 판에서 서로 다른 칸을 presses번 눌러 섞습니다.
// → 같은 칸들을 다시 누르면 반드시 풀리므로 "항상 풀 수 있는" 문제가 됩니다.
// 돌려주는 값: { grid: 섞인 판, solution: 눌렀던 칸 번호들 (힌트용) }
export function createPuzzle(size, presses) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let grid = createSolvedGrid(size)
    const solution = []

    while (solution.length < presses) {
      const index = Math.floor(Math.random() * size * size)
      if (!solution.includes(index)) {
        solution.push(index)
        grid = toggleCell(grid, size, index)
      }
    }

    // 우연히 다시 다 풀린 판이 되면 다시 만듦
    if (!isSolved(grid)) return { grid, solution }
  }

  // 아주 드물게 실패하면 한 칸만 눌린 문제
  return { grid: toggleCell(createSolvedGrid(size), size, 0), solution: [0] }
}

// 칸 이름 (예: 0번 → "R1-A", 5번 → "R2-B")
export function getCellLabel(size, index) {
  const row = Math.floor(index / size) + 1
  const col = String.fromCharCode(65 + (index % size)) // 65 = 'A'
  return `R${row}-${col}`
}
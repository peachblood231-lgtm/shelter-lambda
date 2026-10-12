import { useState } from 'react'
import { createPuzzle, toggleCell, isSolved, countWarm, getCellLabel } from '../game/heatMatrix'
// 매트릭스 퍼즐·시작 카드 전용 스타일
import '../styles/matrix.css'

// 열 분배 매트릭스 퍼즐 화면입니다.
// (나가기는 화면 왼쪽 위 돌아가기 버튼이 담당합니다)
// 받는 값:
// - title: 제목
// - size: 한 줄 칸 수 (4 → 4×4)
// - presses: 문제를 섞은 횟수 (난이도)
// - moveLimit: 이동 횟수 제한
// - reward: 성공 보상 (REPAIR)
// - showHint: 첫 수 힌트를 보여 줄지 (정비 보고서 보유)
// - onFinish: 끝났을 때 실행 (성공이면 true, 실패면 false)
function HeatMatrix({ title, size, presses, moveLimit, reward, showHint, onFinish }) {
  // 문제는 화면이 처음 열릴 때 한 번만 만듦
  const [puzzle] = useState(() => createPuzzle(size, presses))
  // 지금 판 상태, 이동 횟수, 결과('playing' / 'success' / 'fail')
  const [grid, setGrid] = useState(puzzle.grid)
  const [moves, setMoves] = useState(0)
  const [result, setResult] = useState('playing')

  // 힌트: 아직 한 번도 안 눌렀을 때만, 정답 중 한 칸을 주황 점선으로 표시
  const hintIndex = showHint && moves === 0 ? puzzle.solution[0] : null
  const total = size * size

  // 칸 누르기
  function handleCell(index) {
    if (result !== 'playing') return

    const nextGrid = toggleCell(grid, size, index)
    const nextMoves = moves + 1
    setGrid(nextGrid)
    setMoves(nextMoves)

    if (isSolved(nextGrid)) {
      setResult('success')
      onFinish(true)
    } else if (nextMoves >= moveLimit) {
      setResult('fail')
      onFinish(false)
    }
  }

  return (
    <section className="hmx" aria-labelledby="hmx-title">
      {/* 머리: 제목 + 이동 횟수·WARM 개수 */}
      <div className="hmx-head">
        <div>
          <p className="hmx-code">CALIBRATION</p>
          <h2 id="hmx-title" className="hmx-title">
            {title}
          </h2>
        </div>
        <dl className="hmx-stats">
          <div>
            <dt>MOVES</dt>
            <dd>
              {moves} / {moveLimit}
            </dd>
          </div>
          <div>
            <dt>WARM</dt>
            <dd>
              {countWarm(grid)} / {total}
            </dd>
          </div>
        </dl>
      </div>

      <div className="hmx-body">
        {/* 4×4 판 */}
        <div
          className="hmx-grid"
          style={{ gridTemplateColumns: `repeat(${size}, auto)` }}
          role="group"
          aria-label="열 분배 구역"
        >
          {grid.map((isWarm, index) => {
            // 구역 이름 (예: R1-A) — 화면에는 안 보이고 화면 낭독기만 읽음
            const label = getCellLabel(size, index)
            let className = isWarm ? 'hmx-cell is-warm' : 'hmx-cell'
            if (index === hintIndex) className += ' is-hint'

            return (
              <button
                key={label}
                type="button"
                className={className}
                aria-label={`${label} ${isWarm ? 'WARM' : 'COLD'}`}
                disabled={result !== 'playing'}
                onClick={() => handleCell(index)}
              >
                <span className="hmx-cell-state">{isWarm ? 'WARM' : 'COLD'}</span>
              </button>
            )
          })}
        </div>

        {/* 오른쪽: 규칙, 힌트, 결과 */}
        <div className="hmx-side">
          <p className="hmx-rule">
            누른 구역과 위·아래·왼쪽·오른쪽 구역의 상태가 함께 바뀝니다. 이동 제한 안에 모든 구역을
            WARM으로 만드세요.
          </p>

          {hintIndex !== null && <p className="hmx-hint">MAINTENANCE REPORT: START AT THE MARKED SECTOR</p>}

          {result === 'success' && (
            <p className="hmx-result is-success" role="status">
              CALIBRATION COMPLETE · REPAIR +{reward}
            </p>
          )}
          {result === 'fail' && (
            <p className="hmx-result is-fail" role="status">
              CALIBRATION FAILED · MOVE LIMIT EXCEEDED
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default HeatMatrix
import { useState } from 'react'
import { createPuzzle, toggleCell, isSolved, countWarm, getCellLabel } from '../game/heatMatrix'
import { useT } from '../i18n/strings'
import '../styles/matrix.css'

// 열 분배 매트릭스 퍼즐 화면입니다.
// 받는 값:
// - title: 제목
// - size: 한 줄 칸 수 (4 → 4×4)
// - presses: 문제를 섞은 횟수 (난이도)
// - moveLimit: 이동 횟수 제한
// - reward: 성공 보상 (REPAIR)
// - showHint: 첫 수 힌트를 보여 줄지 (정비 보고서 보유)
// - onFinish: 끝났을 때 실행 (성공이면 true, 실패면 false)
function HeatMatrix({ title, size, presses, moveLimit, reward, showHint, onFinish }) {
  const t = useT()

  const [puzzle] = useState(() => createPuzzle(size, presses))
  const [grid, setGrid] = useState(puzzle.grid)
  const [moves, setMoves] = useState(0)
  const [result, setResult] = useState('playing')

  const hintIndex = showHint && moves === 0 ? puzzle.solution[0] : null
  const total = size * size

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
      <div className="hmx-head">
        <div>
          <p className="hmx-code">{t('matrix.code')}</p>
          <h2 id="hmx-title" className="hmx-title">
            {title}
          </h2>
        </div>
        <dl className="hmx-stats">
          <div>
            <dt>{t('matrix.moves')}</dt>
            <dd>
              {moves} / {moveLimit}
            </dd>
          </div>
          <div>
            <dt>{t('matrix.warmCount')}</dt>
            <dd>
              {countWarm(grid)} / {total}
            </dd>
          </div>
        </dl>
      </div>

      <div className="hmx-body">
        <div
          className="hmx-grid"
          style={{ gridTemplateColumns: `repeat(${size}, auto)` }}
          role="group"
          aria-label={t('matrix.gridLabel')}
        >
          {grid.map((isWarm, index) => {
            const label = getCellLabel(size, index)
            const stateText = isWarm ? t('matrix.warm') : t('matrix.cold')
            let className = isWarm ? 'hmx-cell is-warm' : 'hmx-cell'
            if (index === hintIndex) className += ' is-hint'

            return (
              <button
                key={label}
                type="button"
                className={className}
                aria-label={`${label} ${stateText}`}
                disabled={result !== 'playing'}
                onClick={() => handleCell(index)}
              >
                <span className="hmx-cell-state">{stateText}</span>
              </button>
            )
          })}
        </div>

        <div className="hmx-side">
          <p className="hmx-rule">{t('matrix.rule')}</p>

          {hintIndex !== null && <p className="hmx-hint">{t('matrix.hint')}</p>}

          {result === 'success' && (
            <p className="hmx-result is-success" role="status">
              {t('matrix.success', { points: reward })}
            </p>
          )}
          {result === 'fail' && (
            <p className="hmx-result is-fail" role="status">
              {t('matrix.fail')}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default HeatMatrix
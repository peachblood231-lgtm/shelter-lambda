import { useEffect, useRef } from 'react'
import StatusPanel from './StatusPanel'

// 대시보드의 "틀"입니다.
// 오른쪽 위 상태 표시와 하단 진행 바는 항상 그대로 있고,
// 제목·오른쪽 열·가운데 내용은 바깥에서 넘겨주는 값에 따라 바뀝니다.
//
// 받는 값(props):
// - title: 큰 제목 (예: 'CENTRAL TERMINAL', 'GREENHOUSE')
// - status: 오른쪽 위 상태 표시 값
// - recovery: 진행 바의 문구와 퍼센트
// - side: (선택) 오른쪽 열에 넣을 내용. 없으면 가운데가 전체 너비를 씀
// - onBack: (선택) 있으면 화면 왼쪽 위에 돌아가기 버튼을 보여 줌
// - children: 가운데 영역에 들어갈 내용
function DashboardLayout({ title, status, recovery, side, onBack, children }) {
  const backButtonRef = useRef(null)
  const hasBack = Boolean(onBack)

  // 돌아가기 버튼이 생기면(=시설에 들어가면) 그 버튼에 초점을 옮깁니다.
  // 키보드 사용자가 화면이 바뀐 뒤에도 위치를 잃지 않게 하기 위해서예요.
  useEffect(() => {
    if (hasBack) {
      backButtonRef.current?.focus()
    }
  }, [title, hasBack])

  return (
    <div className="term">
      <div className="term-inner">
        {/* ── 오른쪽 위 구석 상태 표시 ── */}
        <StatusPanel status={status} />

        {/* ── 돌아가기 버튼 (onBack이 있을 때만) ── */}
        {hasBack && (
          <button
            ref={backButtonRef}
            type="button"
            className="term-back term-back--top"
            onClick={onBack}
          >
            ← CENTRAL TERMINAL
          </button>
        )}

        {/* ── 헤더 ── */}
        <header className="term-header">
          <p className="term-code">S - LAMBDA - 032</p>
          <h1 className="term-title">{title}</h1>
        </header>

        {/* ── 가운데: 내용 + (있으면) 오른쪽 열 ── */}
        <div className={side ? 'term-body' : 'term-body term-body--full'}>
          <main className="term-main">{children}</main>
          {side && <div className="term-side">{side}</div>}
        </div>

        {/* ── 하단 진행 바 ── */}
        <footer className="term-recovery">
          <div
            className="term-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={recovery.percent}
            aria-label={recovery.label}
          >
            {/* 퍼센트만큼 흰색으로 채웁니다 */}
            <div className="term-progress-fill" style={{ width: `${recovery.percent}%` }} />
          </div>
          <p className="term-progress-label">{recovery.label}</p>
        </footer>
      </div>
    </div>
  )
}

export default DashboardLayout
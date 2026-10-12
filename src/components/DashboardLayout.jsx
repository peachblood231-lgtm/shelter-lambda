import { useEffect, useRef } from 'react'
import StatusPanel from './StatusPanel'

// 대시보드의 "틀"입니다.
// 받는 값(props):
// - title: 큰 제목
// - code: (선택) 제목 위 작은 글자. 기본값 'S - LAMBDA - 032'
// - headerAside: (선택) 제목 오른쪽에 놓을 내용
// - status: 오른쪽 위 상태 표시 값 (주민 수, 구역 목록)
// - temperatures: 지금 온도 { inside, outside }
// - rations: 지금 가진 식량 합계
// - linkedSectors: 신호가 연결된 구역 이름 목록
// - onOpenSignal: 오른쪽 위 구역 목록을 눌렀을 때 실행
// - recovery: 진행 바의 문구와 퍼센트
// - side: (선택) 오른쪽 열 내용
// - onBack: (선택) 있으면 왼쪽 위 돌아가기 버튼
// - backLabel: (선택) 돌아가기 버튼 글자. 기본값 'CENTRAL TERMINAL'
// - children: 가운데 영역 내용
function DashboardLayout({
  title,
  code = 'S - LAMBDA - 032',
  headerAside,
  status,
  temperatures,
  rations,
  linkedSectors,
  onOpenSignal,
  recovery,
  side,
  onBack,
  backLabel = 'CENTRAL TERMINAL',
  children,
}) {
  const backButtonRef = useRef(null)
  const hasBack = Boolean(onBack)

  // 다른 화면으로 들어가면 돌아가기 버튼에 초점을 옮깁니다. (키보드 사용자를 위해)
  useEffect(() => {
    if (hasBack) {
      backButtonRef.current?.focus()
    }
  }, [title, hasBack])

  return (
    <div className="term">
      <div className="term-inner">
        {/* ── 오른쪽 위 구석 상태 표시 ── */}
        <StatusPanel
          status={status}
          inside={temperatures.inside}
          outside={temperatures.outside}
          rations={rations}
          linkedSectors={linkedSectors}
          onOpenSignal={onOpenSignal}
        />

        {/* ── 돌아가기 버튼 (onBack이 있을 때만) ── */}
        {hasBack && (
          <button ref={backButtonRef} type="button" className="term-back term-back--top" onClick={onBack}>
            ← {backLabel}
          </button>
        )}

        {/* ── 헤더 ── */}
        <header className="term-header">
          <div>
            <p className="term-code">{code}</p>
            <h1 className="term-title">{title}</h1>
          </div>
          {headerAside}
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
            <div className="term-progress-fill" style={{ width: `${recovery.percent}%` }} />
          </div>
          <p className="term-progress-label">{recovery.label}</p>
        </footer>
      </div>
    </div>
  )
}

export default DashboardLayout
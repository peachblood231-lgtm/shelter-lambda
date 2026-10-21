import { useEffect, useRef } from 'react'
import { useT } from '../i18n/strings'

// 확인 팝업입니다. (브라우저 기본 <dialog> 사용)
// 받는 값:
// - title: 제목
// - rows: 내용 줄 목록 [{ label, value }]
// - confirmLabel: 확인 버튼 글자
// - onConfirm: 확인을 눌렀을 때 실행할 함수
// - onClose: 팝업이 닫혔을 때 실행할 함수 (확인·취소·Esc 모두)
function ConfirmDialog({ title, rows, confirmLabel, onConfirm, onClose }) {
  const t = useT()
  const dialogRef = useRef(null)

  // 확인 버튼을 이미 눌렀는지 (두 번 눌러도 한 번만 처리하기 위해)
  const isConfirmedRef = useRef(false)

  // 화면에 나타나면 팝업 열기
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  function closeDialog() {
    dialogRef.current?.close()
  }

  function handleConfirm() {
    if (isConfirmedRef.current) return
    isConfirmedRef.current = true
    onConfirm()
    closeDialog()
  }

  // 팝업 바깥(배경)을 누르면 닫기
  function handleClick(event) {
    if (event.target === dialogRef.current) {
      closeDialog()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="term-confirm"
      aria-labelledby="confirm-title"
      onClose={onClose}
      onClick={handleClick}
    >
      <div className="term-confirm-inner">
        <h2 id="confirm-title" className="term-confirm-title">
          {title}
        </h2>

        <button type="button" className="term-plants-close" aria-label={t('common.close')} onClick={closeDialog} />

        <dl className="term-confirm-rows">
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="term-confirm-actions">
          <button type="button" className="term-confirm-btn" onClick={closeDialog}>
            {t('common.cancel')}
          </button>
          <button type="button" className="term-confirm-btn term-confirm-btn--primary" onClick={handleConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
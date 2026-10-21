import { useEffect, useRef } from 'react'
import { useT } from '../i18n/strings'

// 식물 목록 팝업입니다. (브라우저 기본 <dialog>)
// 받는 값:
// - title: 팝업 제목 (구역 코드)
// - plants: 식물 이름 배열 (고유명사라 영어 그대로)
// - onClose: 팝업이 닫혔을 때 실행할 함수
function PlantListDialog({ title, plants, onClose }) {
  const t = useT()
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  function closeDialog() {
    dialogRef.current?.close()
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
      className="term-plants"
      aria-labelledby="plant-list-title"
      onClose={onClose}
      onClick={handleClick}
    >
      <div className="term-plants-inner">
        <h2 id="plant-list-title" className="term-plants-title">
          {title}
        </h2>

        <button type="button" className="term-plants-close" aria-label={t('common.close')} onClick={closeDialog} />

        <div className="term-plants-scroll">
          <ul className="term-plants-list">
            {plants.map((plant) => (
              <li key={plant}>{plant}</li>
            ))}
          </ul>
        </div>
      </div>
    </dialog>
  )
}

export default PlantListDialog
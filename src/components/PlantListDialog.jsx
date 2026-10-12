import { useEffect, useRef } from 'react'

// 식물 목록 팝업입니다.
// 브라우저에 기본으로 있는 <dialog>(대화 상자)를 써서
// Esc 키로 닫기, 팝업 안에서만 Tab 이동 같은 기능을 자동으로 얻습니다.
//
// 받는 값:
// - title: 팝업 제목 (구역 코드)
// - plants: 식물 이름 배열
// - onClose: 팝업이 닫혔을 때 실행할 함수
function PlantListDialog({ title, plants, onClose }) {
  const dialogRef = useRef(null)

  // 화면에 나타나면 팝업을 엽니다.
  // (이미 열려 있으면 다시 열지 않도록 확인 — 개발 모드에서 두 번 실행돼도 안전)
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  // 팝업을 닫습니다. 닫히면 아래 onClose가 자동으로 실행됩니다.
  function closeDialog() {
    dialogRef.current?.close()
  }

  // 팝업 바깥(배경)을 누르면 닫기
  // 배경을 누르면 클릭된 대상이 dialog 자체가 됩니다.
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
      onClose={onClose} // Esc, 닫기 버튼, 바깥 클릭 모두 여기로 모입니다
      onClick={handleClick}
    >
      <div className="term-plants-inner">
        <h2 id="plant-list-title" className="term-plants-title">
          {title}
        </h2>

        {/* 오른쪽 위 흰 세모 닫기 버튼 */}
        <button type="button" className="term-plants-close" aria-label="닫기" onClick={closeDialog} />

        {/* 목록이 길면 이 안에서만 스크롤 */}
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
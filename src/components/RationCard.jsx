import { formatCountdown } from '../utils/format'
// 배급 카드 전용 스타일
import '../styles/ration.css'

// 다이닝홀 오른쪽 열의 비상 배급 카드입니다.
// 받는 값:
// - title: 카드 제목
// - units / maxUnits: 쌓인 회분 / 최대 회분
// - unitRation: 1회분의 배급량 (예: 단백질 바 1개 = 5)
// - itemName: 받을 때 들어오는 아이템 이름
// - isFull: 가득 찼는지
// - nextInMs: 다음 배급까지 남은 밀리초
// - onCollect: COLLECT를 눌렀을 때 실행
function RationCard({ title, units, maxUnits, unitRation, itemName, isFull, nextInMs, onCollect }) {
  return (
    <section className="ration-card" aria-labelledby="ration-title">
      <div className="ration-head">
        <h2 id="ration-title" className="ration-title">
          {title}
        </h2>
        <p className="ration-value">
          {units * unitRation}
          <span> / {maxUnits * unitRation}</span>
        </p>
      </div>

      {/* 남은 시간 (매초 바뀌므로 화면 낭독기가 계속 읽지 않게 aria-live 없음) */}
      <p className="ration-next">
        {isFull ? 'STOCK FULL' : `NEXT +${unitRation} IN ${formatCountdown(nextInMs)}`}
      </p>

      <button type="button" className="ration-collect" disabled={units < 1} onClick={onCollect}>
        {units > 0 ? `COLLECT · ${itemName} ×${units}` : 'NOTHING TO COLLECT'}
      </button>
    </section>
  )
}

export default RationCard
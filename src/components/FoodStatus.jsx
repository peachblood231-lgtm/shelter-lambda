// 오른쪽 열 맨 위의 "FOOD PRODUCE 상태" 표시입니다.
// 받는 값: state (예: 'LIMITED')
// 상태 글자를 소문자로 바꿔 클래스 이름에 붙입니다. (예: term-food--limited)
// CSS에서 상태마다 다른 색을 줄 수 있어요.
function FoodStatus({ state }) {
  return (
    <div className={`term-food term-food--${state.toLowerCase()}`}>
      <span className="term-food-label">FOOD PRODUCE</span>
      <strong className="term-food-state">{state}</strong>
    </div>
  )
}

export default FoodStatus
import { hasString, useT } from '../i18n/strings'

// 오른쪽 열 맨 위의 "FOOD PRODUCE 상태" 표시입니다.
// 받는 값: state (예: 'LIMITED')
// 상태 글자를 소문자로 바꿔 클래스 이름에 붙입니다. (예: term-food--limited → 주황색)
function FoodStatus({ state }) {
  const t = useT()
  const key = `food.state.${state}`

  return (
    <div className={`term-food term-food--${state.toLowerCase()}`}>
      <span className="term-food-label">{t('food.label')}</span>
      <strong className="term-food-state">{hasString(key) ? t(key) : state}</strong>
    </div>
  )
}

export default FoodStatus
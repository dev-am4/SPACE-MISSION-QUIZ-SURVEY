import { questions } from './questions'

const questionMap = new Map(questions.map((question) => [question.number, question]))
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function buildOptionsRow(question, selectedLetter) {
  const row = document.createElement('div')
  row.className = 'review-options-row'
  row.dataset.selected = selectedLetter || ''
  row.setAttribute('aria-label', 'ตัวเลือกทั้งหมดของคำถามนี้')

  question.options.forEach((option, index) => {
    const letter = LETTERS[index]
    const selected = letter === selectedLetter
    const choice = document.createElement('span')
    choice.className = `review-option-pill${selected ? ' selected' : ''}`
    choice.title = selected ? `คำตอบที่เลือก: ${letter}. ${option}` : `${letter}. ${option}`

    const label = document.createElement('b')
    label.className = 'review-option-letter'
    label.textContent = `${letter}.`

    const text = document.createElement('span')
    text.className = 'review-option-text'
    text.textContent = option

    choice.append(label, text)

    if (selected) {
      const mark = document.createElement('span')
      mark.className = 'review-option-selected-mark'
      mark.textContent = '✓'
      mark.setAttribute('aria-label', 'คำตอบที่เลือกไว้')
      choice.append(mark)
    }

    row.appendChild(choice)
  })

  return row
}

function enhanceReviewItems() {
  document.querySelectorAll('.review-item').forEach((item) => {
    const numberText = item.querySelector('.review-number')?.textContent?.trim()
    const questionNumber = Number(numberText)
    const question = questionMap.get(questionNumber)
    const content = item.querySelector('.review-content')
    const selectedLine = content?.querySelector(':scope > p')

    if (!question || !content || !selectedLine) return

    const selectedLetter = selectedLine.textContent.trim().match(/^([A-F])\./)?.[1] || ''
    const existing = content.querySelector(':scope > .review-options-row')

    if (existing?.dataset.selected === selectedLetter) {
      selectedLine.classList.add('review-selected-original')
      return
    }

    existing?.remove()
    selectedLine.classList.add('review-selected-original')
    selectedLine.insertAdjacentElement('afterend', buildOptionsRow(question, selectedLetter))
  })
}

const observer = new MutationObserver(() => enhanceReviewItems())

function startReviewEnhancer() {
  const root = document.getElementById('root')
  if (!root) return
  observer.observe(root, { childList: true, subtree: true })
  enhanceReviewItems()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startReviewEnhancer, { once: true })
} else {
  startReviewEnhancer()
}

import { questions } from './questions'

const questionMap = new Map(questions.map((question) => [question.number, question]))
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

let lastAcceptedQuestionKey = ''
let lastAcceptedAt = 0
let root = null
let enhanceQueued = false

function getCurrentQuestionKey(card) {
  const screen = card.closest('.quiz-screen')
  const chip = screen?.querySelector('.mission-chip')?.textContent?.trim()
  const text = screen?.querySelector('.question-card h2')?.textContent?.trim()
  return `${chip || ''}|${text || ''}`
}

function guardDuplicateAnswerClicks(event) {
  const card = event.target.closest?.('.answer-card')
  if (!card) return

  const questionKey = getCurrentQuestionKey(card)
  if (!questionKey) return

  const now = performance.now()
  if (lastAcceptedQuestionKey === questionKey && now - lastAcceptedAt < 450) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation?.()
    return
  }

  lastAcceptedQuestionKey = questionKey
  lastAcceptedAt = now
}

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

function updateReviewCompletion(items) {
  if (!items.length) return

  const answeredCount = items.reduce((count, item) => {
    return count + (item.querySelector('.review-options-row')?.dataset.selected ? 1 : 0)
  }, 0)
  const missingCount = questions.length - answeredCount

  const status = document.querySelector('.review-status span')
  const continueButton = document.querySelector('.review-actionbar .primary-btn')
  const statusWrap = document.querySelector('.review-status')
  const nextStatus = missingCount === 0
    ? `ตอบครบ ${questions.length} ข้อ`
    : `ตอบแล้ว ${answeredCount}/${questions.length} ข้อ · ยังขาด ${missingCount} ข้อ`

  if (status && status.textContent !== nextStatus) status.textContent = nextStatus
  statusWrap?.classList.toggle('review-status-incomplete', missingCount > 0)

  if (continueButton) {
    continueButton.disabled = missingCount > 0
    continueButton.setAttribute('aria-disabled', missingCount > 0 ? 'true' : 'false')
    continueButton.title = missingCount > 0
      ? 'กรุณากดแก้ไขข้อที่ยังไม่ได้ตอบให้ครบก่อนยืนยัน'
      : ''
  }
}

function enhanceReviewItems() {
  const items = [...document.querySelectorAll('.review-item')]

  items.forEach((item) => {
    const numberText = item.querySelector('.review-number')?.textContent?.trim()
    const questionNumber = Number(numberText)
    const question = questionMap.get(questionNumber)
    const content = item.querySelector('.review-content')
    const selectedLine = content?.querySelector(':scope > p')

    if (!question || !content || !selectedLine) return

    const selectedLetter = selectedLine.textContent.trim().match(/^([A-F])\./)?.[1] || ''
    const existing = content.querySelector(':scope > .review-options-row')

    item.classList.toggle('review-item-missing', !selectedLetter)
    selectedLine.classList.add('review-selected-original')

    if (!selectedLetter) selectedLine.dataset.reviewMissing = 'true'
    else delete selectedLine.dataset.reviewMissing

    if (existing?.dataset.selected !== selectedLetter) {
      existing?.remove()
      selectedLine.insertAdjacentElement('afterend', buildOptionsRow(question, selectedLetter))
    }
  })

  updateReviewCompletion(items)
}

function observeRoot() {
  if (root) observer.observe(root, { childList: true, subtree: true })
}

function runEnhanceSafely() {
  observer.disconnect()
  enhanceReviewItems()
  observeRoot()
}

function queueEnhance() {
  if (enhanceQueued) return
  enhanceQueued = true
  queueMicrotask(() => {
    enhanceQueued = false
    runEnhanceSafely()
  })
}

const observer = new MutationObserver(queueEnhance)

function startReviewEnhancer() {
  root = document.getElementById('root')
  if (!root) return

  document.addEventListener('click', guardDuplicateAnswerClicks, true)
  observeRoot()
  runEnhanceSafely()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startReviewEnhancer, { once: true })
} else {
  startReviewEnhancer()
}

import { questions } from './questions'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const PASS_SCORE = 16
const SNAPSHOT_KEY = 'space-mission:review-snapshot'

function makeId(prefix) {
  const random = globalThis.crypto?.randomUUID?.()?.split('-')[0]?.toUpperCase()
  return `${prefix}-${random || Date.now().toString(36).toUpperCase()}`
}

function readReviewSnapshot() {
  const answers = {}

  document.querySelectorAll('.review-item').forEach((item) => {
    const number = Number(item.querySelector('.review-number')?.textContent?.trim())
    const selectedText = item.querySelector('.review-content > p')?.textContent?.trim() || ''
    const letter = selectedText.match(/^([A-F])\./)?.[1]
    const optionIndex = LETTERS.indexOf(letter)
    if (number && optionIndex >= 0) answers[number] = optionIndex
  })

  const score = questions
    .filter((question) => question.type === 'quiz')
    .reduce((total, question) => total + (answers[question.number] === question.answer ? 1 : 0), 0)

  return { answers, score, capturedAt: new Date().toISOString() }
}

function saveSnapshot() {
  const snapshot = readReviewSnapshot()
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch (_) {}
  return snapshot
}

function loadSnapshot() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY) || 'null')
    if (parsed && typeof parsed.score === 'number' && parsed.answers) return parsed
  } catch (_) {}
  return null
}

function addEligibilityNote() {
  const welcome = document.querySelector('.welcome-screen .hero-copy-block')
  if (!welcome || welcome.querySelector('.certificate-eligibility-note')) return

  const note = document.createElement('p')
  note.className = 'certificate-eligibility-note'
  note.textContent = 'เกณฑ์รับประกาศนียบัตร: ตอบแบบทดสอบความรู้ถูกอย่างน้อย 16 จาก 20 ข้อ'
  const hint = welcome.querySelector('.touch-hint')
  if (hint) hint.insertAdjacentElement('afterend', note)
  else welcome.appendChild(note)
}

function createAnswerPayload(snapshot) {
  return questions.map((question) => {
    const optionIndex = snapshot.answers[question.number]
    return {
      question_number: question.number,
      question_text: question.text,
      option_index: optionIndex,
      option_letter: Number.isInteger(optionIndex) ? LETTERS[optionIndex] : null,
      option_text: Number.isInteger(optionIndex) ? question.options[optionIndex] : null,
      type: question.type,
      is_correct: question.type === 'quiz' && Number.isInteger(optionIndex)
        ? optionIndex === question.answer
        : null,
    }
  })
}

async function saveCompletedSurvey(snapshot) {
  const now = new Date().toISOString()
  const id = makeId('SESSION')
  const recordId = makeId('NO-CERT')

  try {
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        certificate_id: recordId,
        participant_name: 'ไม่ระบุชื่อ',
        knowledge_score: snapshot.score,
        knowledge_total: 20,
        started_at: null,
        confirmed_at: now,
        finished_at: now,
        answers: createAnswerPayload(snapshot),
      }),
      keepalive: true,
    })
  } catch (_) {
    // การแสดงผลสำหรับผู้เข้าชมต้องทำงานต่อได้แม้การบันทึกข้อมูลภายนอกไม่พร้อมใช้งาน
  }
}

function showNotEligible(score) {
  const screen = document.querySelector('.confirm-screen')
  if (!screen) return

  screen.querySelector('.certificate-threshold-overlay')?.remove()

  const overlay = document.createElement('div')
  overlay.className = 'certificate-threshold-overlay'
  overlay.innerHTML = `
    <section class="certificate-threshold-panel" role="dialog" aria-modal="true" aria-label="ผลแบบทดสอบความรู้">
      <div class="certificate-threshold-score"><strong>${score}</strong><span>/20</span></div>
      <p class="certificate-threshold-kicker">ผลแบบทดสอบความรู้</p>
      <h2>ยังไม่ถึงเกณฑ์รับประกาศนียบัตร</h2>
      <p>ต้องตอบถูกอย่างน้อย <b>${PASS_SCORE} จาก 20 ข้อ</b> จึงจะได้รับประกาศนียบัตรดิจิทัล</p>
      <p class="certificate-threshold-thanks">ขอบคุณสำหรับการร่วมทำแบบทดสอบและแบบประเมินนิทรรศการ</p>
      <div class="certificate-threshold-actions">
        <button type="button" class="secondary-btn certificate-threshold-review">กลับไปตรวจทาน</button>
        <button type="button" class="primary-btn certificate-threshold-restart">เริ่มทำใหม่</button>
      </div>
    </section>
  `

  screen.appendChild(overlay)

  overlay.querySelector('.certificate-threshold-review')?.addEventListener('click', () => {
    overlay.remove()
    document.querySelector('.confirm-screen .confirm-actions .secondary-btn')?.click()
  })

  overlay.querySelector('.certificate-threshold-restart')?.addEventListener('click', () => {
    window.location.replace(window.location.pathname)
  })
}

function onDocumentClick(event) {
  const reviewContinue = event.target.closest?.('.review-screen .review-actionbar .primary-btn')
  if (reviewContinue) {
    saveSnapshot()
    return
  }

  const confirmButton = event.target.closest?.('.confirm-screen .confirm-actions .primary-btn')
  if (!confirmButton) return

  const snapshot = loadSnapshot()
  if (!snapshot) return

  if (snapshot.score < PASS_SCORE) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation?.()
    saveCompletedSurvey(snapshot)
    showNotEligible(snapshot.score)
  }
}

let queued = false
function refresh() {
  queued = false
  addEligibilityNote()
}

function queueRefresh() {
  if (queued) return
  queued = true
  requestAnimationFrame(refresh)
}

function start() {
  document.addEventListener('click', onDocumentClick, true)
  const root = document.getElementById('root')
  if (!root) return
  queueRefresh()
  const observer = new MutationObserver(queueRefresh)
  observer.observe(root, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
  start()
}

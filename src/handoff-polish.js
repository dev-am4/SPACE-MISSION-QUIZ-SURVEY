const ZONE_LABELS = [
  'ประวัติศาสตร์ดาราศาสตร์',
  'กำเนิดจักรวาล',
  'ระบบสุริยะ',
  'ภารกิจสำรวจอวกาศ',
  'สื่อปฏิสัมพันธ์',
  'อาชีพในอนาคต',
]

function setText(selector, value) {
  const node = document.querySelector(selector)
  if (node && node.textContent !== value) node.textContent = value
}

function polishWelcome() {
  if (!document.querySelector('.welcome-screen')) return

  setText('.welcome-screen .eyebrow', 'แบบทดสอบความรู้และแบบประเมินนิทรรศการ')
  setText(
    '.welcome-screen .hero-copy',
    'ร่วมทบทวนความรู้ด้านดาราศาสตร์และอวกาศ พร้อมแบ่งปันความคิดเห็นต่อการจัดแสดง และรับประกาศนียบัตรดิจิทัลเมื่อทำครบ',
  )
  setText('.welcome-screen .touch-hint', 'แตะเพื่อเริ่ม หรือสแกนคิวอาร์โค้ดเพื่อทำผ่านมือถือ')
  setText('.welcome-screen .label-a', 'เรียนรู้')
  setText('.welcome-screen .label-b', 'สำรวจ')
  setText('.welcome-screen .label-c', 'ค้นพบ')
  setText('.welcome-screen .poster-code', 'ศูนย์วิทยาศาสตร์เพื่อการศึกษานครสวรรค์')

  document.querySelectorAll('.welcome-screen .zone-ribbon span').forEach((node, index) => {
    if (ZONE_LABELS[index] && node.textContent !== ZONE_LABELS[index]) node.textContent = ZONE_LABELS[index]
  })
}

function polishQuiz() {
  const screen = document.querySelector('.quiz-screen')
  if (!screen) return

  const topLabel = screen.querySelector('.top-title span')
  const ghost = screen.querySelector('.mission-chip.ghost')
  const isSurvey = ghost?.textContent?.includes('SURVEY') || topLabel?.textContent?.includes('VISITOR SURVEY')
  const isEditing = topLabel?.textContent?.includes('EDIT ANSWER')

  if (topLabel) {
    const next = isEditing ? 'แก้ไขคำตอบ' : isSurvey ? 'แบบประเมินนิทรรศการ' : 'แบบทดสอบความรู้'
    if (topLabel.textContent !== next) topLabel.textContent = next
  }

  const questionChip = screen.querySelector('.mission-chip:not(.ghost)')
  if (questionChip) {
    const match = questionChip.textContent.match(/(\d+)/)
    if (match) questionChip.textContent = `ข้อ ${Number(match[1])}`
  }

  if (ghost) {
    const next = isSurvey ? 'แบบประเมิน' : 'ดาราศาสตร์และอวกาศ'
    if (ghost.textContent !== next) ghost.textContent = next
  }
}

function polishReview() {
  if (!document.querySelector('.review-screen')) return
  setText('.review-screen .eyebrow', 'ตรวจทานคำตอบ')
}

function polishConfirm() {
  if (!document.querySelector('.confirm-screen')) return
  setText('.confirm-screen .eyebrow', 'ยืนยันคำตอบ')
}

function polishNameEntry() {
  if (!document.querySelector('.name-screen')) return
  setText('.name-screen .eyebrow', 'ประกาศนียบัตรดิจิทัล')
}

function polishCertificate() {
  if (!document.querySelector('.certificate-screen')) return
  setText('.certificate-toolbar .eyebrow', 'ทำแบบทดสอบเสร็จสมบูรณ์')
  setText('.cert-kicker', 'โครงการปรับปรุงนิทรรศการดาราศาสตร์และอวกาศ')
  setText('.cert-qr-box span', 'สแกนเพื่อเปิดประกาศนียบัตรบนมือถือ')

  const warning = document.querySelector('.sync-warning')
  if (warning) warning.textContent = 'ประกาศนียบัตรพร้อมดาวน์โหลด กรุณาบันทึกไฟล์ไว้ในอุปกรณ์ของคุณ'

  const idBox = document.querySelector('.cert-id')
  if (idBox && idBox.childNodes[0]?.nodeType === Node.TEXT_NODE) {
    idBox.childNodes[0].textContent = 'เลขที่\n'
  }
}

function polishSharedStates() {
  const panel = document.querySelector('.shared-state-panel')
  if (!panel) return

  const title = panel.querySelector('h1')?.textContent || ''
  const copy = panel.querySelector('p')
  if (!copy) return

  if (title.includes('กำลังเปิดประกาศนียบัตร')) {
    copy.textContent = 'กรุณารอสักครู่'
  } else if (title.includes('ไม่พบข้อมูลประกาศนียบัตร')) {
    copy.textContent = 'กรุณาสแกนคิวอาร์โค้ดใหม่อีกครั้ง หรือกลับไปเริ่มทำแบบทดสอบ'
  }
}

let queued = false
function polish() {
  queued = false
  polishWelcome()
  polishQuiz()
  polishReview()
  polishConfirm()
  polishNameEntry()
  polishCertificate()
  polishSharedStates()
}

function queuePolish() {
  if (queued) return
  queued = true
  requestAnimationFrame(polish)
}

function start() {
  const root = document.getElementById('root')
  if (!root) return
  queuePolish()
  const observer = new MutationObserver(queuePolish)
  observer.observe(root, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
  start()
}

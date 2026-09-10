import QRCode from 'qrcode'

let observer
let rendering = false

function ensureWelcomeHook() {
  const hero = document.querySelector('.welcome-screen .hero-copy-block')
  if (!hero) return

  if (!hero.querySelector('.welcome-hook')) {
    const hook = document.createElement('div')
    hook.className = 'welcome-hook'
    hook.innerHTML = `
      <span class="welcome-hook-kicker">ก่อนออกจากนิทรรศการ</span>
      <strong>มาร่วมสนุกก่อนกลับ!</strong>
      <p>ทดสอบความรู้ · บอกโซนที่ชอบ · รับประกาศนียบัตรดิจิทัล</p>
    `
    const title = hero.querySelector('h1')
    if (title) hero.insertBefore(hook, title)
    else hero.prepend(hook)
  }

  if (!hero.querySelector('.welcome-join-banner')) {
    const banner = document.createElement('div')
    banner.className = 'welcome-join-banner'
    banner.setAttribute('aria-label', 'ข้อมูลการเข้าร่วมกิจกรรม')
    banner.innerHTML = `
      <span><b>แตะ</b> ทำบนจอนี้</span>
      <span><b>สแกน</b> ทำบนมือถือ</span>
      <span><b>หลายคน</b> ทำพร้อมกันได้</span>
    `
    const button = hero.querySelector('.hero-start')
    if (button) hero.insertBefore(banner, button)
    else hero.appendChild(banner)
  }
}

async function ensureWelcomeQr() {
  if (rendering) return
  const poster = document.querySelector('.welcome-screen .mission-poster')
  if (!poster || poster.querySelector('.welcome-mobile-qr')) return

  rendering = true
  try {
    const url = `${window.location.origin}${window.location.pathname}`
    const card = document.createElement('div')
    card.className = 'welcome-mobile-qr'
    card.setAttribute('aria-label', 'คิวอาร์โค้ดสำหรับเปิดแบบสอบถามบนมือถือ')

    const qrWrap = document.createElement('div')
    qrWrap.className = 'welcome-mobile-qr-code'

    const img = document.createElement('img')
    img.alt = 'คิวอาร์โค้ดสำหรับเปิดแบบสอบถามบนมือถือ'
    img.src = await QRCode.toDataURL(url, {
      width: 420,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#06111f', light: '#ffffff' },
    })
    qrWrap.appendChild(img)

    const copy = document.createElement('div')
    copy.className = 'welcome-mobile-qr-copy'
    copy.innerHTML = `
      <span class="welcome-mobile-qr-kicker">ทำผ่านมือถือ</span>
      <b>มาเป็นกลุ่ม?<br>สแกนพร้อมกันได้เลย</b>
      <span>เปิดกล้องมือถือ แล้วสแกนเพื่อเริ่มทำแบบทดสอบและประเมินได้ทันที</span>
      <strong>ไม่ต้องรอคิวหน้าจอ</strong>
    `

    card.append(qrWrap, copy)
    poster.appendChild(card)
  } catch (error) {
    console.warn('Welcome QR generation failed', error)
  } finally {
    rendering = false
  }
}

function ensureWelcomeExperience() {
  ensureWelcomeHook()
  ensureWelcomeQr()
}

function startWelcomeQr() {
  ensureWelcomeExperience()
  const root = document.getElementById('root')
  if (!root) return
  observer = new MutationObserver(() => ensureWelcomeExperience())
  observer.observe(root, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startWelcomeQr, { once: true })
} else {
  startWelcomeQr()
}

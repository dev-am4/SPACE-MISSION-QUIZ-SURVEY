import QRCode from 'qrcode'

let observer
let rendering = false

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
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#06111f', light: '#ffffff' },
    })
    qrWrap.appendChild(img)

    const copy = document.createElement('div')
    copy.className = 'welcome-mobile-qr-copy'
    copy.innerHTML = '<b>ทำแบบสอบถามผ่านมือถือ</b><span>สแกนคิวอาร์โค้ดเพื่อเริ่มทำแบบสอบถามได้ทันที</span>'

    card.append(qrWrap, copy)
    poster.appendChild(card)
  } catch (error) {
    console.warn('Welcome QR generation failed', error)
  } finally {
    rendering = false
  }
}

function startWelcomeQr() {
  ensureWelcomeQr()
  const root = document.getElementById('root')
  if (!root) return
  observer = new MutationObserver(() => ensureWelcomeQr())
  observer.observe(root, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startWelcomeQr, { once: true })
} else {
  startWelcomeQr()
}

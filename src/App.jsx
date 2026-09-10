import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  Download,
  Edit3,
  FileCheck2,
  QrCode,
  RotateCcw,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { questions, sourceNote } from './questions'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const STORAGE_KEY = 'space-mission-quiz-survey:sessions:v2'
const PROJECT_NAME = 'โครงการปรับปรุงนิทรรศการดาราศาสตร์และอวกาศ'
const PROJECT_PLACE = 'ณ ศูนย์วิทยาศาสตร์เพื่อการศึกษานครสวรรค์'

function makeId(prefix = 'SM') {
  const random = globalThis.crypto?.randomUUID?.()?.split('-')[0]?.toUpperCase()
  return `${prefix}-${random || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase()}`
}

function saveSession(session) {
  try {
    const previous = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    previous.push(session)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(previous.slice(-500)))
  } catch (error) {
    console.warn('Unable to save session locally', error)
  }
}

function SpaceBackdrop({ variant = 'default' }) {
  return (
    <div className={`project-backdrop project-backdrop-${variant}`} aria-hidden="true">
      <img src="/space-exhibition-bg.svg" alt="" className="project-backdrop-image" />
      <div className="project-vignette" />
      <div className="project-grid" />
    </div>
  )
}

function ProjectIdentity({ compact = false }) {
  return (
    <div className={`project-identity ${compact ? 'compact' : ''}`}>
      <div className="project-seal"><Rocket size={compact ? 18 : 22} strokeWidth={1.8} /></div>
      <div>
        <strong>{PROJECT_NAME}</strong>
        <span>{PROJECT_PLACE}</span>
      </div>
    </div>
  )
}

function Welcome({ onStart }) {
  return (
    <main className="screen welcome-screen">
      <SpaceBackdrop variant="welcome" />
      <div className="welcome-top"><ProjectIdentity /></div>

      <section className="hero-layout">
        <div className="hero-copy-block">
          <p className="eyebrow">DIGITAL CERTIFICATE STATION · FUTURE CAREERS ZONE</p>
          <h1>SPACE MISSION<br/><span>QUIZ & SURVEY</span></h1>
          <p className="hero-copy">
            แบบทดสอบความรู้ดาราศาสตร์และอวกาศ และแบบประเมินนิทรรศการ
            ผ่านประสบการณ์แบบ Interactive สำหรับจอ Touchscreen
          </p>
          <button className="primary-btn hero-start" onClick={onStart}>
            <span>เริ่มทำแบบทดสอบ</span>
            <Rocket size={24} />
          </button>
          <p className="touch-hint">แตะเพื่อเริ่มภารกิจ · คำตอบสามารถตรวจทานและแก้ไขได้ก่อนยืนยัน</p>
        </div>

        <div className="mission-poster" aria-hidden="true">
          <div className="poster-orbit orbit-one" />
          <div className="poster-orbit orbit-two" />
          <div className="poster-planet"><span /></div>
          <div className="poster-moon" />
          <div className="poster-label label-a">EXPLORE</div>
          <div className="poster-label label-b">LEARN</div>
          <div className="poster-label label-c">DISCOVER</div>
          <div className="poster-code">NSC · 06 / DIGITAL STATION</div>
        </div>
      </section>

      <div className="zone-ribbon" aria-hidden="true">
        <span>HERITAGE</span><i/> <span>BIG BANG</span><i/> <span>SOLAR SYSTEM</span><i/>
        <span>SPACE MISSION</span><i/> <span>INTERACTIVE</span><i/> <span>FUTURE CAREERS</span>
      </div>
    </main>
  )
}

function Quiz({ index, answers, onAnswer, onBack, editing }) {
  const q = questions[index]
  const selected = answers[q.number]
  const progress = ((index + 1) / questions.length) * 100
  const isSurvey = q.type === 'survey'

  return (
    <main className="screen quiz-screen">
      <SpaceBackdrop variant="quiz" />
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="ย้อนกลับ"><ChevronLeft size={28}/></button>
        <div className="top-title">
          <span>{editing ? 'EDIT ANSWER' : isSurvey ? 'VISITOR SURVEY' : 'KNOWLEDGE QUIZ'}</span>
          <strong>{PROJECT_NAME}</strong>
        </div>
        <div className="counter">{index + 1}<span>/</span>{questions.length}</div>
      </header>

      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      <section className="question-wrap">
        <div className="question-meta-row">
          <span className="mission-chip">QUESTION {String(q.number).padStart(2, '0')}</span>
          <span className="mission-chip ghost">{isSurvey ? 'SURVEY' : 'ASTRONOMY & SPACE'}</span>
        </div>

        <div className="question-card">
          <div className="question-card-visual" aria-hidden="true">
            <span className="visual-orbit" />
            <span className="visual-dot d1" />
            <span className="visual-dot d2" />
          </div>
          <h2>{q.text}</h2>
        </div>

        <div className={`answers-grid ${q.options.length > 4 ? 'answers-grid-six' : ''}`}>
          {q.options.map((option, optionIndex) => {
            const active = selected === optionIndex
            return (
              <button
                key={`${q.number}-${optionIndex}`}
                className={`answer-card ${active ? 'selected' : ''}`}
                onClick={() => onAnswer(q.number, optionIndex)}
              >
                <span className="answer-letter">{LETTERS[optionIndex]}</span>
                <span className="answer-text">{option}</span>
                <span className="answer-check">{active && <Check size={24} strokeWidth={3}/>}</span>
              </button>
            )
          })}
        </div>

        <p className="quiz-footnote">
          {editing ? 'แตะคำตอบใหม่ ระบบจะกลับไปหน้าตรวจทานโดยอัตโนมัติ' : 'แตะหนึ่งคำตอบเพื่อดำเนินการต่อ'}
        </p>
      </section>
    </main>
  )
}

function Review({ answers, onEdit, onContinue }) {
  const quizItems = questions.filter(q => q.type === 'quiz')
  const surveyItems = questions.filter(q => q.type === 'survey')

  const renderItem = (q) => {
    const optionIndex = answers[q.number]
    return (
      <article className="review-item" key={q.number}>
        <div className="review-number">{String(q.number).padStart(2, '0')}</div>
        <div className="review-content">
          <h3>{q.text}</h3>
          <p><b>{LETTERS[optionIndex]}.</b> {q.options[optionIndex]}</p>
        </div>
        <button className="edit-btn" onClick={() => onEdit(q.number)}><Edit3 size={18}/> แก้ไข</button>
      </article>
    )
  }

  return (
    <main className="screen review-screen">
      <SpaceBackdrop variant="review" />
      <header className="review-header">
        <ProjectIdentity compact />
        <div className="review-heading">
          <p className="eyebrow">MISSION REVIEW</p>
          <h1>ตรวจทานคำตอบก่อนยืนยัน</h1>
          <p>ตรวจสอบทุกข้อให้เรียบร้อย สามารถแตะ “แก้ไข” ที่ข้อใดก็ได้ก่อนยืนยันทั้งหมด</p>
        </div>
      </header>

      <section className="review-scroll">
        <div className="review-section-title"><span>01</span><div><b>แบบทดสอบความรู้</b><small>ข้อ 1–20</small></div></div>
        <div className="review-list">{quizItems.map(renderItem)}</div>

        <div className="review-section-title survey-title"><span>02</span><div><b>แบบประเมินนิทรรศการ</b><small>ตามลำดับข้อในเอกสารต้นฉบับ</small></div></div>
        <div className="review-list">{surveyItems.map(renderItem)}</div>
        <div className="review-spacer" />
      </section>

      <footer className="review-actionbar">
        <div className="review-status"><CheckCircle2 size={22}/><span>ตอบครบ {questions.length} ข้อ</span></div>
        <button className="primary-btn" onClick={onContinue}>ตรวจทานเสร็จแล้ว <FileCheck2 size={23}/></button>
      </footer>
    </main>
  )
}

function Confirm({ onBack, onConfirm }) {
  return (
    <main className="screen confirm-screen">
      <SpaceBackdrop variant="confirm" />
      <section className="confirm-panel">
        <div className="confirm-icon"><ShieldCheck size={42} /></div>
        <p className="eyebrow">FINAL CONFIRMATION</p>
        <h1>ยืนยันคำตอบทั้งหมด</h1>
        <p className="confirm-copy">
          หลังจากยืนยันแล้ว จะไม่สามารถกลับไปแก้ไขคำตอบได้<br/>
          ระบบจะดำเนินการต่อไปยังขั้นตอนสร้างประกาศนียบัตรดิจิทัล
        </p>
        <div className="confirm-project"><ProjectIdentity compact /></div>
        <div className="confirm-actions">
          <button className="secondary-btn" onClick={onBack}><ArrowLeft size={21}/> กลับไปตรวจทาน</button>
          <button className="primary-btn" onClick={onConfirm}>ยืนยันทั้งหมด <Check size={23}/></button>
        </div>
      </section>
    </main>
  )
}

function NameEntry({ value, onChange, onSubmit }) {
  const inputRef = useRef(null)
  useEffect(() => inputRef.current?.focus(), [])

  return (
    <main className="screen name-screen">
      <SpaceBackdrop variant="name" />
      <section className="name-panel">
        <ProjectIdentity compact />
        <div className="mission-badge small"><ShieldCheck size={28}/></div>
        <p className="eyebrow">DIGITAL CERTIFICATE</p>
        <h1>กรอกชื่อสำหรับประกาศนียบัตร</h1>
        <p>กรุณาตรวจสอบการสะกดชื่อให้ถูกต้องก่อนสร้างใบประกาศ</p>
        <input
          ref={inputRef}
          className="name-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onSubmit() }}
          placeholder="ชื่อ - นามสกุล"
          maxLength={80}
          autoComplete="off"
        />
        <button className="primary-btn" disabled={!value.trim()} onClick={onSubmit}>สร้างประกาศนียบัตร <Sparkles size={23}/></button>
      </section>
    </main>
  )
}

function Certificate({ name, score, certificateId, issuedAt, onRestart }) {
  const certRef = useRef(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [downloading, setDownloading] = useState(false)
  const dateLabel = useMemo(() => new Date(issuedAt).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric'
  }), [issuedAt])

  useEffect(() => {
    const payload = [
      PROJECT_NAME,
      PROJECT_PLACE,
      `Certificate ID: ${certificateId}`,
      `Name: ${name}`,
      `Knowledge Score: ${score}/20`,
      `Issued: ${dateLabel}`,
    ].join('\n')

    QRCode.toDataURL(payload, {
      width: 340,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0b1830', light: '#ffffff' },
    }).then(setQrDataUrl).catch((error) => console.warn('QR generation failed', error))
  }, [certificateId, dateLabel, name, score])

  async function downloadPdf() {
    if (!certRef.current || downloading) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f7f2e8',
        logging: false,
      })
      const imageData = canvas.toDataURL('image/png', 1)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
      const width = canvas.width * ratio
      const height = canvas.height * ratio
      pdf.addImage(imageData, 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height, undefined, 'FAST')
      const safeName = name.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_') || 'participant'
      pdf.save(`Space-Mission-Certificate-${safeName}-${certificateId}.pdf`)
    } catch (error) {
      console.error('PDF generation failed', error)
      alert('ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <main className="screen certificate-screen">
      <SpaceBackdrop variant="certificate" />
      <section className="certificate-shell">
        <div className="certificate-toolbar">
          <div>
            <p className="eyebrow">MISSION ACCOMPLISHED</p>
            <h1>ประกาศนียบัตรพร้อมแล้ว</h1>
          </div>
          <div className="certificate-actions">
            <button className="download-btn" onClick={downloadPdf} disabled={downloading}>
              <Download size={21}/>{downloading ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF'}
            </button>
            <button className="secondary-btn" onClick={onRestart}><RotateCcw size={20}/> เริ่มใหม่</button>
          </div>
        </div>

        <div className="certificate" id="certificate-card" ref={certRef}>
          <div className="cert-space-art" aria-hidden="true" />
          <div className="cert-frame" aria-hidden="true" />
          <div className="cert-header">
            <div className="cert-seal"><img src="/certificate-seal.svg" alt="" /></div>
            <div className="cert-project">
              <strong>{PROJECT_NAME}</strong>
              <span>{PROJECT_PLACE}</span>
            </div>
            <div className="cert-id">ID<br/><b>{certificateId}</b></div>
          </div>

          <div className="cert-body">
            <p className="cert-kicker">DIGITAL CERTIFICATE · SPACE MISSION</p>
            <h1>ประกาศนียบัตรดิจิทัล</h1>
            <p className="cert-label">มอบให้แก่</p>
            <h2>{name}</h2>
            <div className="cert-line" />
            <p className="cert-text">ผู้ผ่านการทำแบบทดสอบความรู้ดาราศาสตร์และอวกาศ<br/>และแบบประเมินนิทรรศการ</p>
          </div>

          <div className="cert-footer-grid">
            <div className="cert-score-box"><span>คะแนนความรู้</span><strong>{score}<small>/20</small></strong></div>
            <div className="cert-date-box"><span>วันที่ออกประกาศนียบัตร</span><strong>{dateLabel}</strong></div>
            <div className="cert-qr-box">
              {qrDataUrl ? <img src={qrDataUrl} alt="QR Code ประกาศนียบัตร" /> : <QrCode size={54} />}
              <span>QR CERTIFICATE DATA</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function App() {
  const [view, setView] = useState('welcome')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [name, setName] = useState('')
  const [startedAt, setStartedAt] = useState(null)
  const [confirmedAt, setConfirmedAt] = useState(null)
  const [issuedAt, setIssuedAt] = useState(null)
  const [certificateId, setCertificateId] = useState('')
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [lastTouch, setLastTouch] = useState(Date.now())

  const score = useMemo(() => questions
    .filter(q => q.type === 'quiz')
    .reduce((total, q) => total + (answers[q.number] === q.answer ? 1 : 0), 0), [answers])

  useEffect(() => {
    const markActive = () => setLastTouch(Date.now())
    window.addEventListener('pointerdown', markActive)
    window.addEventListener('keydown', markActive)
    return () => {
      window.removeEventListener('pointerdown', markActive)
      window.removeEventListener('keydown', markActive)
    }
  }, [])

  useEffect(() => {
    if (view === 'welcome') return
    const timer = window.setInterval(() => {
      if (Date.now() - lastTouch > 180000) restart()
    }, 10000)
    return () => window.clearInterval(timer)
  }, [view, lastTouch])

  function start() {
    setStartedAt(new Date().toISOString())
    setIndex(0)
    setAnswers({})
    setName('')
    setConfirmedAt(null)
    setIssuedAt(null)
    setCertificateId('')
    setEditingQuestion(null)
    setView('quiz')
  }

  function answer(questionNumber, optionIndex) {
    setAnswers(prev => ({ ...prev, [questionNumber]: optionIndex }))
    window.setTimeout(() => {
      if (editingQuestion !== null) {
        setEditingQuestion(null)
        setView('review')
        return
      }
      if (index < questions.length - 1) setIndex(v => v + 1)
      else setView('review')
    }, 220)
  }

  function backFromQuiz() {
    if (editingQuestion !== null) {
      setEditingQuestion(null)
      setView('review')
      return
    }
    if (index === 0) setView('welcome')
    else setIndex(v => v - 1)
  }

  function editQuestion(questionNumber) {
    const nextIndex = questions.findIndex(q => q.number === questionNumber)
    if (nextIndex < 0) return
    setEditingQuestion(questionNumber)
    setIndex(nextIndex)
    setView('quiz')
  }

  function confirmAll() {
    setConfirmedAt(new Date().toISOString())
    setCertificateId(makeId('NSC'))
    setView('name')
  }

  function finishCertificate() {
    const now = new Date().toISOString()
    const finalName = name.trim()
    const finalId = certificateId || makeId('NSC')
    setName(finalName)
    setCertificateId(finalId)
    setIssuedAt(now)

    saveSession({
      id: makeId('SESSION'),
      certificate_id: finalId,
      started_at: startedAt,
      confirmed_at: confirmedAt,
      finished_at: now,
      participant_name: finalName,
      knowledge_score: score,
      knowledge_total: 20,
      answers: questions.map(q => ({
        question_number: q.number,
        question_text: q.text,
        option_index: answers[q.number],
        option_letter: LETTERS[answers[q.number]],
        option_text: q.options[answers[q.number]],
        type: q.type,
        is_correct: q.type === 'quiz' ? answers[q.number] === q.answer : null,
      }))
    })
    setView('certificate')
  }

  function restart() {
    setView('welcome')
    setIndex(0)
    setAnswers({})
    setName('')
    setStartedAt(null)
    setConfirmedAt(null)
    setIssuedAt(null)
    setCertificateId('')
    setEditingQuestion(null)
    setLastTouch(Date.now())
  }

  if (view === 'welcome') return <Welcome onStart={start} />
  if (view === 'quiz') return <Quiz index={index} answers={answers} onAnswer={answer} onBack={backFromQuiz} editing={editingQuestion !== null} />
  if (view === 'review') return <Review answers={answers} onEdit={editQuestion} onContinue={() => setView('confirm')} />
  if (view === 'confirm') return <Confirm onBack={() => setView('review')} onConfirm={confirmAll} />
  if (view === 'name') return <NameEntry value={name} onChange={setName} onSubmit={finishCertificate} />
  return <Certificate name={name} score={score} certificateId={certificateId} issuedAt={issuedAt} onRestart={restart} />
}

export { sourceNote }

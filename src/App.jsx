import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, RotateCcw, Rocket, ShieldCheck, Sparkles } from 'lucide-react'
import { questions, sourceNote } from './questions'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const STORAGE_KEY = 'space-mission-quiz-survey:sessions:v1'

function saveSession(session) {
  try {
    const previous = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    previous.push(session)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(previous.slice(-500)))
  } catch (error) {
    console.warn('Unable to save session locally', error)
  }
}

function Stars() {
  return (
    <div className="space-bg" aria-hidden="true">
      <div className="nebula nebula-a" />
      <div className="nebula nebula-b" />
      <div className="orbit orbit-a" />
      <div className="orbit orbit-b" />
      <div className="stars stars-a" />
      <div className="stars stars-b" />
    </div>
  )
}

function Welcome({ onStart }) {
  return (
    <main className="screen welcome-screen">
      <Stars />
      <section className="hero-panel glass">
        <div className="mission-badge"><Rocket size={32} strokeWidth={1.6} /></div>
        <p className="eyebrow">DIGITAL CERTIFICATE STATION</p>
        <h1>SPACE MISSION<br/><span>QUIZ & SURVEY</span></h1>
        <p className="hero-copy">แบบทดสอบความรู้ดาราศาสตร์และอวกาศ และแบบประเมินนิทรรศการ</p>
        <button className="primary-btn pulse" onClick={onStart}>
          <span>เริ่มทำแบบทดสอบ</span>
          <Rocket size={24} />
        </button>
        <p className="touch-hint">แตะหน้าจอเพื่อเริ่มภารกิจ</p>
      </section>
      <div className="planet planet-main" aria-hidden="true" />
    </main>
  )
}

function Quiz({ index, answers, onAnswer, onBack }) {
  const q = questions[index]
  const selected = answers[q.number]
  const progress = ((index + 1) / questions.length) * 100
  const isSurvey = q.type === 'survey'

  return (
    <main className="screen quiz-screen">
      <Stars />
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="ย้อนกลับ"><ChevronLeft size={28}/></button>
        <div className="top-title">
          <span>{isSurvey ? 'SURVEY' : 'KNOWLEDGE QUIZ'}</span>
          <strong>QUESTION {String(q.number).padStart(2, '0')}</strong>
        </div>
        <div className="counter">{index + 1}<span>/</span>{questions.length}</div>
      </header>

      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      <section className="question-wrap">
        <div className="question-card glass">
          <div className="question-number">{String(q.number).padStart(2, '0')}</div>
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
      </section>
    </main>
  )
}

function Summary({ score, onContinue }) {
  return (
    <main className="screen summary-screen">
      <Stars />
      <section className="result-panel glass">
        <div className="success-orbit"><Sparkles size={42}/></div>
        <p className="eyebrow">MISSION COMPLETE</p>
        <h1>เสร็จสิ้นแบบทดสอบ</h1>
        <div className="score-ring">
          <div><strong>{score}</strong><span>/20</span></div>
          <small>คะแนนความรู้</small>
        </div>
        <p className="result-copy">ดำเนินการต่อเพื่อจัดทำประกาศนียบัตรดิจิทัล</p>
        <button className="primary-btn" onClick={onContinue}>สร้างประกาศนียบัตร <ShieldCheck size={24}/></button>
      </section>
    </main>
  )
}

function NameEntry({ value, onChange, onSubmit }) {
  const inputRef = useRef(null)
  useEffect(() => inputRef.current?.focus(), [])

  return (
    <main className="screen name-screen">
      <Stars />
      <section className="name-panel glass">
        <div className="mission-badge small"><ShieldCheck size={28}/></div>
        <p className="eyebrow">DIGITAL CERTIFICATE</p>
        <h1>กรอกชื่อสำหรับประกาศนียบัตร</h1>
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
        <button className="primary-btn" disabled={!value.trim()} onClick={onSubmit}>ยืนยันชื่อ <Check size={24}/></button>
      </section>
    </main>
  )
}

function Certificate({ name, score, onRestart }) {
  return (
    <main className="screen certificate-screen">
      <Stars />
      <section className="certificate-shell">
        <div className="certificate">
          <div className="cert-corner c1"/><div className="cert-corner c2"/><div className="cert-corner c3"/><div className="cert-corner c4"/>
          <div className="cert-icon"><Rocket size={36}/></div>
          <p className="cert-kicker">SPACE MISSION QUIZ & SURVEY</p>
          <h1>ประกาศนียบัตรดิจิทัล</h1>
          <p className="cert-label">มอบให้แก่</p>
          <h2>{name}</h2>
          <div className="cert-line" />
          <p className="cert-text">ผู้ผ่านการทำแบบทดสอบความรู้ดาราศาสตร์และอวกาศ<br/>และแบบประเมินนิทรรศการ</p>
          <div className="cert-score"><span>คะแนนความรู้</span><strong>{score} / 20</strong></div>
          <p className="cert-footer">DIGITAL CERTIFICATE STATION</p>
        </div>
        <button className="secondary-btn" onClick={onRestart}><RotateCcw size={22}/> เริ่มใหม่</button>
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
    setView('quiz')
  }

  function answer(questionNumber, optionIndex) {
    setAnswers(prev => ({ ...prev, [questionNumber]: optionIndex }))
    window.setTimeout(() => {
      if (index < questions.length - 1) setIndex(v => v + 1)
      else setView('summary')
    }, 260)
  }

  function back() {
    if (index === 0) setView('welcome')
    else setIndex(v => v - 1)
  }

  function finishCertificate() {
    const finishedAt = new Date().toISOString()
    saveSession({
      id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      started_at: startedAt,
      finished_at: finishedAt,
      participant_name: name.trim(),
      knowledge_score: score,
      answers: questions.map(q => ({
        question_number: q.number,
        option_index: answers[q.number],
        option_letter: LETTERS[answers[q.number]],
        option_text: q.options[answers[q.number]]
      }))
    })
    setName(name.trim())
    setView('certificate')
  }

  function restart() {
    setView('welcome')
    setIndex(0)
    setAnswers({})
    setName('')
    setStartedAt(null)
    setLastTouch(Date.now())
  }

  if (view === 'welcome') return <Welcome onStart={start} />
  if (view === 'quiz') return <Quiz index={index} answers={answers} onAnswer={answer} onBack={back} />
  if (view === 'summary') return <Summary score={score} onContinue={() => setView('name')} />
  if (view === 'name') return <NameEntry value={name} onChange={setName} onSubmit={finishCertificate} />
  return <Certificate name={name} score={score} onRestart={restart} />
}

export { sourceNote }

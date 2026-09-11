import { questions } from './questions'

/*
 * Anti-copy quiz randomization.
 *
 * - Knowledge questions (1-20) are shuffled on every new attempt.
 * - Answer positions inside each knowledge question are shuffled too.
 * - Survey questions (21-25) keep their original order and semantics.
 * - Every attempt receives a deterministic seed so the exact question/answer
 *   layout can be reproduced later without changing any visitor-facing UI.
 */
const SHUFFLE_SESSION_KEY = 'space-mission-quiz-survey:shuffle-session:v1'
const SHUFFLE_HISTORY_KEY = 'space-mission-quiz-survey:shuffle-history:v1'
const MAX_HISTORY = 100

const canonicalQuiz = questions
  .filter((question) => question.type === 'quiz')
  .map((question) => ({
    number: question.number,
    options: [...question.options],
    answer: question.answer,
  }))

const questionByNumber = new Map(questions.map((question) => [question.number, question]))
const canonicalQuizOrder = canonicalQuiz.map((question) => question.number)
const canonicalSurveyOrder = questions
  .filter((question) => question.type === 'survey')
  .map((question) => question.number)

function createSeed() {
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buffer)
    return buffer[0].toString(16).padStart(8, '0')
  }

  return Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0')
}

function seedToUint32(seed) {
  const parsed = Number.parseInt(String(seed), 16)
  if (Number.isFinite(parsed)) return parsed >>> 0

  let hash = 2166136261
  for (const character of String(seed)) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededRandom(seed) {
  let state = seedToUint32(seed)
  return function random() {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function randomInt(max, random) {
  if (max <= 1) return 0
  return Math.floor(random() * max)
}

function shuffledIndexes(length, random) {
  const indexes = Array.from({ length }, (_, index) => index)

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1, random)
    ;[indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]]
  }

  return indexes
}

function randomizeQuizQuestionOrder(random) {
  const order = shuffledIndexes(canonicalQuizOrder.length, random)
    .map((index) => canonicalQuizOrder[index])

  // Guarantee that a new attempt never accidentally receives the untouched
  // original sequence, even in the extremely unlikely no-op shuffle case.
  const unchanged = order.every((number, index) => number === canonicalQuizOrder[index])
  if (unchanged && order.length > 1) {
    ;[order[0], order[1]] = [order[1], order[0]]
  }

  const shuffledQuiz = order
    .map((number) => questionByNumber.get(number))
    .filter(Boolean)
  const orderedSurvey = canonicalSurveyOrder
    .map((number) => questionByNumber.get(number))
    .filter(Boolean)

  questions.splice(0, questions.length, ...shuffledQuiz, ...orderedSurvey)
  return order
}

function randomizeQuizAnswers(random) {
  const optionOrders = {}

  canonicalQuiz.forEach((canonical) => {
    const question = questionByNumber.get(canonical.number)
    if (!question) return

    const order = shuffledIndexes(canonical.options.length, random)
    let answerIndex = order.indexOf(canonical.answer)

    // Move the correct answer away from its original letter every attempt so
    // memorising the source A/B/C/D key is not useful.
    if (answerIndex === canonical.answer && order.length > 1) {
      let swapIndex = randomInt(order.length - 1, random)
      if (swapIndex >= answerIndex) swapIndex += 1
      ;[order[answerIndex], order[swapIndex]] = [order[swapIndex], order[answerIndex]]
      answerIndex = swapIndex
    }

    question.options = order.map((originalIndex) => canonical.options[originalIndex])
    question.answer = answerIndex
    optionOrders[canonical.number] = [...order]
  })

  return optionOrders
}

function writeSessionState(state) {
  try {
    sessionStorage.setItem(SHUFFLE_SESSION_KEY, JSON.stringify(state))
  } catch (_) {}

  try {
    const previous = JSON.parse(localStorage.getItem(SHUFFLE_HISTORY_KEY) || '[]')
    const history = Array.isArray(previous) ? previous : []
    history.push(state)
    localStorage.setItem(SHUFFLE_HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)))
  } catch (_) {}
}

function updateHistoryFromSubmission(submission) {
  const state = globalThis.__spaceMissionQuizShuffle
  if (!state) return

  try {
    const previous = JSON.parse(localStorage.getItem(SHUFFLE_HISTORY_KEY) || '[]')
    if (!Array.isArray(previous)) return

    const next = previous.map((item) => item.seed === state.seed
      ? {
          ...item,
          session_id: submission.id || item.session_id || null,
          certificate_id: submission.certificate_id || item.certificate_id || null,
          knowledge_score: Number.isFinite(Number(submission.knowledge_score))
            ? Number(submission.knowledge_score)
            : item.knowledge_score ?? null,
          submitted_at: new Date().toISOString(),
        }
      : item)

    localStorage.setItem(SHUFFLE_HISTORY_KEY, JSON.stringify(next.slice(-MAX_HISTORY)))
  } catch (_) {}
}

function randomizeQuizAttempt(seed = createSeed()) {
  const random = seededRandom(seed)
  const questionOrder = randomizeQuizQuestionOrder(random)
  const optionOrders = randomizeQuizAnswers(random)

  const state = {
    seed,
    started_at: new Date().toISOString(),
    quiz_order: [...questionOrder],
    option_orders: optionOrders,
  }

  globalThis.__spaceMissionQuizRandomizedAt = Date.now()
  globalThis.__spaceMissionQuizSeed = seed
  globalThis.__spaceMissionQuizQuestionOrder = [...questionOrder]
  globalThis.__spaceMissionQuizOptionOrders = optionOrders
  globalThis.__spaceMissionQuizShuffle = state

  writeSessionState(state)
  return state
}

/*
 * The existing API stores answers as JSONB. Enrich each answer with shuffle
 * audit metadata before /api/submit is called, so no database schema/UI change
 * is required and a submitted session can still be reconstructed later.
 */
const nativeFetch = globalThis.fetch?.bind(globalThis)
if (nativeFetch && !globalThis.__spaceMissionShuffleFetchPatched) {
  globalThis.__spaceMissionShuffleFetchPatched = true

  globalThis.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url
    const isSubmit = typeof url === 'string' && /\/api\/submit(?:\?|$)/.test(url)
    const isPost = String(init?.method || 'GET').toUpperCase() === 'POST'

    if (isSubmit && isPost && typeof init?.body === 'string') {
      try {
        const submission = JSON.parse(init.body)
        const state = globalThis.__spaceMissionQuizShuffle

        if (state && Array.isArray(submission.answers)) {
          submission.answers = submission.answers.map((answer) => {
            const questionNumber = Number(answer?.question_number)
            const quizPosition = state.quiz_order.indexOf(questionNumber)

            return {
              ...answer,
              shuffle_seed: state.seed,
              quiz_position: quizPosition >= 0 ? quizPosition + 1 : null,
              option_order: state.option_orders?.[questionNumber] || null,
            }
          })

          updateHistoryFromSubmission(submission)
          init = { ...init, body: JSON.stringify(submission) }
        }
      } catch (_) {
        // Never block submission if optional audit enrichment cannot be applied.
      }
    }

    return nativeFetch(input, init)
  }
}

// Debug/recovery helper only; it has no visible UI. Supplying a saved seed
// reproduces the exact question order and answer positions for that attempt.
globalThis.__spaceMissionReplayQuizSeed = (seed) => randomizeQuizAttempt(String(seed))

let lastStartClickAt = 0

document.addEventListener('click', (event) => {
  const startButton = event.target.closest?.('.welcome-screen .hero-start')
  if (!startButton) return

  const now = Date.now()
  if (now - lastStartClickAt < 600) return
  lastStartClickAt = now

  randomizeQuizAttempt()
}, true)

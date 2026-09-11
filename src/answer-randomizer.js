import { questions } from './questions'

/*
 * Randomize both the knowledge-question order (1-20) and each question's
 * answer positions on every new attempt. Survey questions (21-25) keep their
 * original order and answer semantics.
 *
 * We keep a canonical snapshot so every attempt starts from the original data
 * rather than from the previous shuffled attempt. Existing Quiz, Review,
 * scoring and certificate logic continue to read the same question objects,
 * so the UI and downstream behavior do not need to change.
 */
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

function randomInt(max) {
  if (max <= 1) return 0

  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buffer)
    return buffer[0] % max
  }

  return Math.floor(Math.random() * max)
}

function shuffledIndexes(length) {
  const indexes = Array.from({ length }, (_, index) => index)

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]]
  }

  return indexes
}

function randomizeQuizQuestionOrder() {
  const order = shuffledIndexes(canonicalQuizOrder.length)
    .map((index) => canonicalQuizOrder[index])

  // Extremely unlikely, but prevent a complete no-op shuffle so every new
  // attempt is guaranteed to differ from the original question sequence.
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

function randomizeQuizAnswers() {
  canonicalQuiz.forEach((canonical) => {
    const question = questionByNumber.get(canonical.number)
    if (!question) return

    const order = shuffledIndexes(canonical.options.length)
    let answerIndex = order.indexOf(canonical.answer)

    // Make sure the correct letter actually moves away from its original
    // position on every new attempt. This prevents the original answer key
    // from remaining useful even if the other distractors happened to move.
    if (answerIndex === canonical.answer && order.length > 1) {
      let swapIndex = randomInt(order.length - 1)
      if (swapIndex >= answerIndex) swapIndex += 1
      ;[order[answerIndex], order[swapIndex]] = [order[swapIndex], order[answerIndex]]
      answerIndex = swapIndex
    }

    question.options = order.map((originalIndex) => canonical.options[originalIndex])
    question.answer = answerIndex
  })
}

function randomizeQuizAttempt() {
  const questionOrder = randomizeQuizQuestionOrder()
  randomizeQuizAnswers()

  globalThis.__spaceMissionQuizRandomizedAt = Date.now()
  globalThis.__spaceMissionQuizQuestionOrder = [...questionOrder]
}

let lastStartClickAt = 0

document.addEventListener('click', (event) => {
  const startButton = event.target.closest?.('.welcome-screen .hero-start')
  if (!startButton) return

  const now = Date.now()
  if (now - lastStartClickAt < 600) return
  lastStartClickAt = now

  randomizeQuizAttempt()
}, true)

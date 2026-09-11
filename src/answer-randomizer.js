import { questions } from './questions'

/*
 * Randomize only the answer positions for knowledge questions (1-20).
 * The survey (21-25) keeps its original semantic order.
 *
 * We keep a canonical snapshot so every new attempt is shuffled from the
 * original data rather than from the previous attempt. Because all existing
 * screens and scoring logic read the same question objects, mutating those
 * objects here keeps Quiz, Review, score calculation and certificate checks
 * synchronized without changing the UI.
 */
const canonicalQuiz = questions
  .filter((question) => question.type === 'quiz')
  .map((question) => ({
    number: question.number,
    options: [...question.options],
    answer: question.answer,
  }))

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

function randomizeQuizAnswers() {
  canonicalQuiz.forEach((canonical) => {
    const question = questions.find((item) => item.number === canonical.number)
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

  globalThis.__spaceMissionQuizRandomizedAt = Date.now()
}

let lastStartClickAt = 0

document.addEventListener('click', (event) => {
  const startButton = event.target.closest?.('.welcome-screen .hero-start')
  if (!startButton) return

  const now = Date.now()
  if (now - lastStartClickAt < 600) return
  lastStartClickAt = now

  randomizeQuizAnswers()
}, true)

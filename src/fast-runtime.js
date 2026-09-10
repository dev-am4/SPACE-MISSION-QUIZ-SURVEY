// Kiosk speed patch: the quiz intentionally used a 220ms visual pause after each answer.
// For touchscreen operation we remove only that exact delay, leaving all other timers intact.
const nativeSetTimeout = window.setTimeout.bind(window)

window.setTimeout = (handler, delay = 0, ...args) => {
  const normalizedDelay = Number(delay)
  return nativeSetTimeout(handler, normalizedDelay === 220 ? 0 : delay, ...args)
}

// One biometric prompt at a time, and never an automatic re-prompt after the
// user cancelled or an attempt ended in a terminal state.
//
// Why a module-level singleton: LoginScreen and LoginModal each mount a
// LoginComponent, and both auto-prompt on mount and on AppState
// background → active. The OS prompt, and especially Android's lockout-recovery
// PIN screen, pause/resume the activity, so without a shared gate every round
// trip re-triggered a prompt and the user was stuck in prompt → PIN → prompt.

export const BIOMETRIC_REPROMPT_DEBOUNCE_MS = 1500;

export const BIOMETRIC_OUTCOMES = Object.freeze({
  SUCCESS: 'success',
  CANCELLED: 'cancelled',
  // Locked out, invalidated, not enrolled, missing secrets, unknown failure:
  // nothing will change until the user does something.
  TERMINAL: 'terminal',
  // The attempt did not reach the OS prompt (e.g. state was not ready).
  SKIPPED: 'skipped',
});

let inFlight = false;
let suppressed = false;
let lastEndedAt = 0;

const now = () => Date.now();

export const biometricGate = {
  /** Call before showing a prompt. `false` → do not prompt. */
  begin() {
    if (inFlight) {
      return false;
    }
    if (now() - lastEndedAt < BIOMETRIC_REPROMPT_DEBOUNCE_MS) {
      return false;
    }
    inFlight = true;
    return true;
  },
  /** Call once per `begin()` that returned true. */
  end(outcome) {
    inFlight = false;
    lastEndedAt = now();
    suppressed =
      outcome === BIOMETRIC_OUTCOMES.CANCELLED ||
      outcome === BIOMETRIC_OUTCOMES.TERMINAL;
  },
  /** Automatic triggers (mount, foreground) ask this first. */
  shouldAutoPrompt() {
    return !inFlight && !suppressed;
  },
  /** Explicit user action (tap) or a fresh Login mount lifts the suppression. */
  reset() {
    suppressed = false;
  },
  isInFlight() {
    return inFlight;
  },
  /** Tests only. */
  __resetForTests() {
    inFlight = false;
    suppressed = false;
    lastEndedAt = 0;
  },
};

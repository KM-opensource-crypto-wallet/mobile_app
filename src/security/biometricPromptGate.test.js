import {
  BIOMETRIC_OUTCOMES,
  BIOMETRIC_REPROMPT_DEBOUNCE_MS,
  biometricGate,
} from 'security/biometricPromptGate';

describe('biometricGate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000_000);
    biometricGate.__resetForTests();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows one prompt at a time (LoginScreen + LoginModal cannot double-prompt)', () => {
    expect(biometricGate.begin()).toBe(true);
    expect(biometricGate.begin()).toBe(false);
    expect(biometricGate.shouldAutoPrompt()).toBe(false);
    biometricGate.end(BIOMETRIC_OUTCOMES.SUCCESS);
    expect(biometricGate.isInFlight()).toBe(false);
  });

  it('debounces a re-prompt right after one ended (OS dialog round trip)', () => {
    expect(biometricGate.begin()).toBe(true);
    biometricGate.end(BIOMETRIC_OUTCOMES.SUCCESS);
    expect(biometricGate.begin()).toBe(false);
    jest.setSystemTime(1_000_000 + BIOMETRIC_REPROMPT_DEBOUNCE_MS);
    expect(biometricGate.begin()).toBe(true);
  });

  it.each([BIOMETRIC_OUTCOMES.CANCELLED, BIOMETRIC_OUTCOMES.TERMINAL])(
    'after %s, automatic triggers stay quiet until the user acts',
    outcome => {
      biometricGate.begin();
      biometricGate.end(outcome);
      jest.setSystemTime(1_000_000 + 60_000);
      expect(biometricGate.shouldAutoPrompt()).toBe(false);
      // Foreground return after a lockout must NOT prompt again…
      expect(biometricGate.shouldAutoPrompt()).toBe(false);
      // …but a tap on "Use fingerprint" (or a fresh Login mount) may.
      biometricGate.reset();
      expect(biometricGate.shouldAutoPrompt()).toBe(true);
      expect(biometricGate.begin()).toBe(true);
    },
  );

  it.each([BIOMETRIC_OUTCOMES.SUCCESS, BIOMETRIC_OUTCOMES.SKIPPED])(
    'after %s, the next automatic trigger may prompt again',
    outcome => {
      biometricGate.begin();
      biometricGate.end(outcome);
      jest.setSystemTime(1_000_000 + BIOMETRIC_REPROMPT_DEBOUNCE_MS);
      expect(biometricGate.shouldAutoPrompt()).toBe(true);
    },
  );
});

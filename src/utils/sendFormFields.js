/**
 * Update several formik fields in one pass.
 *
 * formik's setFieldValue validates `setIn(state.values, field, value)` - the
 * values captured in the *current render*. Two calls inside one handler
 * therefore both validate against the same pre-update values, each seeing the
 * other field as stale, and the last call's errors overwrite the first's. On
 * the send form only `amount` is validated, so setting `amount` and then
 * `currencyAmount` kept the error computed from the previous amount: right
 * after a QR scan that is '', which surfaced as the "invalid amount" error
 * even though Max had just filled the field.
 *
 * setValues resolves the whole object first and validates it once, so every
 * paired update on these forms must go through here rather than a sequence of
 * setFieldValue calls. Takes formik's `setValues` (a stable reference, so it
 * is safe in a useCallback/useEffect dependency list).
 */
export const setSendFormFields = (setValues, fields) =>
  setValues(prev => ({...prev, ...fields}));

export default setSendFormFields;

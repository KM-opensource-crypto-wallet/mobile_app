// Lets a self-initiated action (e.g. opening an external link) mark that an
// upcoming 'background' transition is expected, so the hide-wallet relock
// listener in components/main.js can tell that apart from the user actually
// switching away. A plain module-level flag is enough - nothing renders off
// this, it's just read once at the moment the app backgrounds.
let expected = false;

export const markExpectedBackground = () => {
  console.log('DEBUG markExpectedBackground: expected set to true');
  expected = true;
};

export const consumeExpectedBackground = () => {
  const wasExpected = expected;
  console.log('DEBUG consumeExpectedBackground: expected was', wasExpected);
  expected = false;
  return wasExpected;
};

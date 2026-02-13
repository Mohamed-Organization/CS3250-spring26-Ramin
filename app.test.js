/**
 * Adds two numbers together.
 * @param {integer} a - The first number.
 * @param {integer} b - The second number.
 * @returns {integer} The sum of a and b.
 */

function sum(a, b) {
  return a + b;
}

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
  
});
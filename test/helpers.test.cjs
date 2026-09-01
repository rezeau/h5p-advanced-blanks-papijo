require('./register-typescript.cjs');

const test = require('ava');
const {
  checkBalancedBrackets,
  checkBalancedHighlightMarkers,
  getLongestString,
  replaceDoubleExclamations,
  shuffleArray
} = require('../src/lib/helpers.ts');

test('getLongestString returns the first longest value and handles an empty list', t => {
  t.is(getLongestString(['a', 'first', 'other']), 'first');
  t.is(getLongestString([]), '');
});

test('shuffleArray mutates and returns the supplied array', t => {
  const originalRandom = Math.random;
  const values = ['a', 'b', 'c'];
  Math.random = () => 0;

  try {
    t.is(shuffleArray(values), values);
    t.deepEqual(values, ['b', 'c', 'a']);
  }
  finally {
    Math.random = originalRandom;
  }
});

test('checkBalancedBrackets reports only alternatives with unbalanced markers', t => {
  t.is(checkBalancedBrackets(['(one)', '[two]', 'plain']), null);
  t.is(checkBalancedBrackets(['(one', 'two]', '', null]), '(one<br>two]');
});

test('checkBalancedHighlightMarkers preserves pairs and marks standalone markers', t => {
  t.is(checkBalancedHighlightMarkers('before [[word]] after'), '');
  t.is(
    checkBalancedHighlightMarkers('before [[word]] then ]]'),
    'before [[word]] then <span class="highlighted unpaired">]]</span>'
  );
});

test('replaceDoubleExclamations alternates opening and closing markers', t => {
  t.is(replaceDoubleExclamations('!!one!! and !!two!!'), '[[one]] and [[two]]');
  t.is(replaceDoubleExclamations('!!open'), '[[open');
});

require('./register-typescript.cjs');

const test = require('ava');
const { Answer, Correctness } = require('../src/scripts/models/answer.ts');
const { Cloze } = require('../src/scripts/models/cloze.ts');
const { ClozeLoader } = require('../src/scripts/content-loaders/cloze-loader.ts');
const { BlankLoader } = require('../src/scripts/content-loaders/blank-loader.ts');
const { Highlight } = require('../src/scripts/models/highlight.ts');
const { Message } = require('../src/scripts/models/message.ts');

const settings = overrides => ({
  caseSensitive: false,
  useRegex: false,
  warnSpellingErrors: true,
  acceptSpellingErrors: false,
  ...overrides
});

test('Answer splits slash alternatives and restores escaped slashes', t => {
  const answer = new Answer('red/and\u250Corange', '', false, 0, settings());
  t.deepEqual(answer.alternatives, ['red', 'and/orange']);
  t.false(answer.appliesAlways);
  t.true(new Answer('   ', '', false, 0, settings()).appliesAlways);
});

test('Answer normalizes surrounding/repeated whitespace and case by default', t => {
  const answer = new Answer('New York', '', false, 0, settings());
  const evaluation = answer.evaluateAttempt('  new   york  ', true);

  t.is(evaluation.correctness, Correctness.ExactMatch);
  t.is(evaluation.usedAlternative, 'New York');
  t.is(evaluation.characterDifferenceCount, 0);
});

test('Answer characterizes spelling tolerance and its disabled state', t => {
  const tolerant = new Answer('abcdefghij', '', false, 0, settings());
  const strict = new Answer('abcdefghij', '', false, 0, settings({ warnSpellingErrors: false }));

  t.is(tolerant.evaluateAttempt('abcdefghiX', true).correctness, Correctness.CloseMatch);
  t.is(tolerant.evaluateAttempt('abcdefgXXX', true).correctness, Correctness.NoMatch);
  t.is(strict.evaluateAttempt('abcdefghiX', true).correctness, Correctness.NoMatch);
});

test('Answer applies regular expressions only while checking incorrect answers', t => {
  const answer = new Answer('^cat$', '', false, 0, settings({ useRegex: true }));
  t.is(answer.evaluateAttempt('cat', false).correctness, Correctness.ExactMatch);
  t.not(answer.evaluateAttempt('cat', true).correctness, Correctness.ExactMatch);

  const missingWord = new Answer('--cat', '', false, 0, settings({ useRegex: true }));
  t.is(missingWord.evaluateAttempt('a dog', false).correctness, Correctness.ExactMatch);
  t.is(missingWord.evaluateAttempt('a cat', false).correctness, Correctness.NoMatch);
});

test('Message links relative highlights and activates the selected highlight', t => {
  const before = [new Highlight('nearest before', 'b0'), new Highlight('far before', 'b1')];
  const after = [new Highlight('nearest after', 'a0')];
  const message = new Message('feedback', true, -2);
  const answer = new Answer('ok', 'feedback', true, 1, settings());

  message.linkHighlight(before, after);
  answer.linkHighlightIdToObject(before, after);
  answer.activateHighlight();

  t.is(message.highlightedElement, before[1]);
  t.true(after[0].isHighlighted);
});

test('Cloze serializes state and delegates reset and solution behavior', t => {
  const calls = [];
  const blank1 = {
    isCorrect: true,
    serialize: () => 'one',
    deserialize: value => calls.push(['deserialize-1', value]),
    reset: () => calls.push(['reset-1']),
    showSolution: () => calls.push(['solution-1'])
  };
  const blank2 = {
    isCorrect: false,
    serialize: () => 'two',
    deserialize: value => calls.push(['deserialize-2', value]),
    reset: () => calls.push(['reset-2']),
    showSolution: () => calls.push(['solution-2'])
  };
  const highlight = new Highlight('text', 'h0');
  highlight.isHighlighted = true;
  const cloze = new Cloze();
  cloze.blanks = [blank1, blank2];
  cloze.highlights = [highlight];

  t.false(cloze.isSolved);
  t.deepEqual(cloze.serialize(), ['one', 'two']);
  cloze.deserialize(['saved one', 'saved two', 'ignored']);
  cloze.reset();
  cloze.showSolutions();

  t.deepEqual(calls, [
    ['deserialize-1', 'saved one'],
    ['deserialize-2', 'saved two'],
    ['reset-1'],
    ['reset-2'],
    ['solution-1'],
    ['solution-2']
  ]);
  t.false(highlight.isHighlighted);
});

test('ClozeLoader converts legacy highlights and normalized blanks in document order', t => {
  const linked = [];
  const blank = {
    id: 'blank_0',
    settings: { highlightMarkersError: false, regexpError: false },
    correctAnswers: [{
      linkHighlightIdToObject: (before, after) => linked.push({ before, after })
    }],
    incorrectAnswers: [],
    hint: { linkHighlight: () => {} }
  };
  BlankLoader.initialize({}, {}, null, null);

  const cloze = ClozeLoader.createCloze('Before !!signal!! ____ after ___', [blank]);

  t.is(
    cloze.html,
    "Before <span id='container_highlight_0'></span> <span id='container_blank_0'></span> after <span></span>"
  );
  t.deepEqual(cloze.blanks, [blank]);
  t.is(cloze.highlights[0].text, 'signal');
  t.deepEqual(linked[0].before, [cloze.highlights[0]]);
  t.deepEqual(linked[0].after, []);
});

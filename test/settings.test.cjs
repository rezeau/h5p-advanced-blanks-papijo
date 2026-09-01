require('./register-typescript.cjs');

const test = require('ava');
const { ClozeType, SelectAlternatives } = require('../src/scripts/models/enums.ts');
const { H5PSettings } = require('../src/scripts/services/settings.ts');

const config = overrides => ({
  behaviour: {
    mode: 'typing',
    selectAlternatives: 'alternatives',
    selectAlternativeRestriction: 5,
    enableRetry: true,
    enableSolutionsButton: true,
    enableCheckButton: true,
    autoCheck: false,
    caseSensitive: true,
    useRegex: false,
    spellingErrorBehaviour: 'warn',
    showSolutionsRequiresInput: true,
    showAllSolutions: true,
    confirmCheckDialog: true,
    confirmRetryDialog: true,
    ...overrides
  },
  media: { disableImageZooming: false }
});

test('typing settings enforce all-alternatives selection and no restriction', t => {
  const result = new H5PSettings(config());

  t.is(result.clozeType, ClozeType.Type);
  t.is(result.selectAlternatives, SelectAlternatives.All);
  t.is(result.selectAlternativeRestriction, 0);
  t.true(result.caseSensitive);
  t.true(result.warnSpellingErrors);
});

test('regex typing disables accepted spelling errors', t => {
  const result = new H5PSettings(config({
    useRegex: true,
    spellingErrorBehaviour: 'accept'
  }));

  t.true(result.useRegex);
  t.false(result.acceptSpellingErrors);
});

test('auto-check typing disables confirmation dialogs', t => {
  const result = new H5PSettings(config({ autoCheck: true }));

  t.false(result.confirmCheckDialog);
  t.false(result.confirmRetryDialog);
});

test('selection mode disables typing-only behavior', t => {
  const result = new H5PSettings(config({ mode: 'selection' }));

  t.is(result.clozeType, ClozeType.Select);
  t.false(result.warnSpellingErrors);
  t.false(result.acceptSpellingErrors);
  t.false(result.caseSensitive);
  t.false(result.useRegex);
  t.false(result.showAllSolutions);
});

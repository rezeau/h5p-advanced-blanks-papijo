require('./register-typescript.cjs');

const test = require('ava');
const {
  H5P,
  baseConfig,
  clickButton,
  createHost,
  installDom
} = require('./h5p-runtime-harness.cjs');

installDom();
const AdvancedBlanksPapiJo = require('../src/scripts/app.ts').default;

function attach(configOverrides = {}, contentData = {}) {
  installDom();
  const instance = new AdvancedBlanksPapiJo(baseConfig(configOverrides), '42', contentData);
  instance.attach(createHost());
  return instance;
}

function attachDetached(configOverrides = {}, contentData = {}) {
  installDom();
  const detachedRoot = document.createElement('div');
  detachedRoot.className = 'h5p-content';
  detachedRoot.dataset.contentId = '42';
  const instance = new AdvancedBlanksPapiJo(baseConfig(configOverrides), '42', contentData);

  instance.attach(H5P.jQuery(detachedRoot));

  return { detachedRoot, instance };
}

function inputs() {
  return [...document.querySelectorAll('input.h5p-text-input')];
}

function type(input, value) {
  input.value = value;
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: value.slice(-1) || 'a', bubbles: true }));
  input.dispatchEvent(new window.Event('change', { bubbles: true }));
}

test.serial('construction and attach render surrounding markup, highlights, blanks, and controls', t => {
  const instance = attach();
  const renderedInputs = inputs();

  t.is(instance.__introduction, 'Complete the sentence.');
  t.true(document.querySelector('.h5p-advanced-blanks') instanceof HTMLElement);
  t.is(document.querySelector('#highlight_0').textContent, 'quick');
  t.regex(document.querySelector('#h5p-cloze-container').textContent, /The quick .* fox is/);
  t.is(renderedInputs.length, 2);
  t.deepEqual(renderedInputs.map(input => input.id), ['cloze0', 'cloze1']);
  t.deepEqual(instance.getCurrentState(), ['', '']);
  t.false(instance.getAnswerGiven());
  t.is(instance.getScore(), 0);
  t.is(instance.getMaxScore(), 2);
  t.false(instance.__buttons['check-answer'].element.hidden);
  t.true(instance.__buttons['show-solution'].element.hidden);
  t.true(instance.__buttons['try-again'].element.hidden);
  t.is(instance.__events.filter(event => event === 'resize').length, 1);
  t.is(
    instance.__buttons['check-answer'].options.confirmationDialog.$parentElement.get(0),
    document.querySelector('.h5p-container')
  );
});

test.serial('typing mode renders blank inputs while the component root is detached', t => {
  const { detachedRoot } = attachDetached();
  const renderedInputs = [...detachedRoot.querySelectorAll('input.h5p-text-input')];

  t.false(detachedRoot.isConnected);
  t.is(renderedInputs.length, 2);
  t.deepEqual(renderedInputs.map(input => input.id), ['cloze0', 'cloze1']);
  t.is(detachedRoot.querySelector('#highlight_0').textContent, 'quick');
  t.is(document.querySelectorAll('input.h5p-text-input').length, 0);

  document.body.appendChild(detachedRoot);
  t.true(detachedRoot.isConnected);
  t.is(detachedRoot.querySelectorAll('input.h5p-text-input').length, 2);
});

test.serial('selection mode renders blank selects while the component root is detached', t => {
  const { detachedRoot } = attachDetached({ behaviour: { mode: 'selection' } });
  const renderedSelects = [...detachedRoot.querySelectorAll('select.h5p-text-input')];

  t.false(detachedRoot.isConnected);
  t.is(renderedSelects.length, 2);
  t.deepEqual(
    [...renderedSelects[0].options].map(option => option.textContent).sort(),
    ['', 'brown', 'red', 'tan'].sort()
  );
  t.is(document.querySelectorAll('select.h5p-text-input').length, 0);

  document.body.appendChild(detachedRoot);
  t.true(detachedRoot.isConnected);
  t.is(detachedRoot.querySelectorAll('select.h5p-text-input').length, 2);
});

test.serial('typing, Check Answer, and xAPI preserve mixed correct/incorrect state', t => {
  const instance = attach();
  const [first, second] = inputs();
  type(first, 'brown');
  type(second, 'slow');

  t.true(instance.getAnswerGiven());
  t.deepEqual(instance.getCurrentState(), ['brown', 'slow']);

  clickButton(instance, 'check-answer');

  t.is(instance.getScore(), 1);
  t.is(instance.getMaxScore(), 2);
  t.true(first.disabled);
  t.false(second.disabled);
  t.true(first.closest('.blank').classList.contains('correct'));
  t.true(second.closest('.blank').classList.contains('error'));
  t.true(instance.__buttons['check-answer'].element.hidden);
  t.false(instance.__buttons['show-solution'].element.hidden);
  t.false(instance.__buttons['try-again'].element.hidden);
  t.deepEqual(instance.__feedback.slice(1, 3), [1, 2]);

  const xapiEvents = instance.__events.filter(event => typeof event === 'object');
  t.is(xapiEvents.length, 1);
  t.is(xapiEvents[0].verb, 'answered');
  t.deepEqual(xapiEvents[0].data.statement.result.score, { raw: 1, max: 2 });
  t.is(xapiEvents[0].data.statement.result.response, 'brown[,]slow');
  t.true(instance.__events.includes('interacted'));

  const reportData = instance.getXAPIData().statement;
  t.is(reportData.object.definition.interactionType, 'fill-in');
  t.deepEqual(reportData.object.definition.correctResponsesPattern, ['{case_matters=false}brown[,]swift']);
  t.deepEqual(reportData.object.definition.extensions['https://h5p.org/x-api/alternatives'], [
    ['brown', 'tan'],
    ['swift']
  ]);
  t.is(reportData.result.response, 'brown[,]slow');
});

test.serial('selection mode renders choices and follows the same check/score lifecycle', t => {
  const instance = attach({ behaviour: { mode: 'selection' } });
  const selects = [...document.querySelectorAll('select.h5p-text-input')];

  t.is(inputs().length, 0);
  t.is(selects.length, 2);
  t.deepEqual(
    [...selects[0].options].map(option => option.textContent).sort(),
    ['', 'brown', 'red', 'tan'].sort()
  );
  selects[0].value = 'tan';
  selects[0].dispatchEvent(new window.Event('change', { bubbles: true }));
  selects[1].value = 'swift';
  selects[1].dispatchEvent(new window.Event('change', { bubbles: true }));

  t.true(instance.getAnswerGiven());
  t.deepEqual(instance.getCurrentState(), ['tan', 'swift']);
  clickButton(instance, 'check-answer');
  t.is(instance.getScore(), 2);
  t.true(selects.every(select => select.disabled));
  t.true(instance.__buttons['show-solution'].element.hidden);
  t.false(instance.__buttons['try-again'].element.hidden);
});

test.serial('Retry clears answers, scoring, feedback, disabled state, and answer-given state', t => {
  const instance = attach();
  const [first, second] = inputs();
  type(first, 'brown');
  type(second, 'slow');
  clickButton(instance, 'check-answer');
  clickButton(instance, 'try-again');

  t.deepEqual(instance.getCurrentState(), ['', '']);
  t.false(instance.getAnswerGiven());
  t.is(instance.getScore(), 0);
  t.false(first.disabled);
  t.false(second.disabled);
  t.is(instance.__feedback, null);
  t.is(instance.__feedbackRemoved, 1);
  t.false(instance.__buttons['check-answer'].element.hidden);
  t.true(instance.__buttons['show-solution'].element.hidden);
  t.true(instance.__buttons['try-again'].element.hidden);
  t.true(instance.__events.filter(event => event === 'resize').length >= 4);
});

test.serial('Show Solution requires checked input, fills missed answers, and keeps shown solutions unscored', t => {
  const instance = attach();
  const [first, second] = inputs();

  clickButton(instance, 'show-solution');
  t.deepEqual(instance.getCurrentState(), ['', '']);
  t.deepEqual(instance.__feedback.slice(1, 3), [0, 2]);

  type(first, 'brown');
  type(second, 'slow');
  clickButton(instance, 'check-answer');
  clickButton(instance, 'show-solution');

  t.deepEqual(instance.getCurrentState(), ['brown', 'swift']);
  t.is(instance.getScore(), 1);
  t.true(first.disabled);
  t.true(second.disabled);
  t.true(second.closest('.blank').classList.contains('showing-solution'));
  t.false(instance.__buttons['try-again'].element.hidden);
});

test.serial('previousState restores values on attach without checking in manual mode', t => {
  const instance = attach({}, { previousState: ['tan', 'saved'] });
  const [first, second] = inputs();

  t.deepEqual(instance.getCurrentState(), ['tan', 'saved']);
  t.deepEqual([first.value, second.value], ['tan', 'saved']);
  t.true(instance.getAnswerGiven());
  t.is(instance.getScore(), 1);
  t.false(first.disabled);
  t.false(second.disabled);
  t.false(instance.__buttons['check-answer'].element.hidden);
  t.is(instance.__events.filter(event => typeof event === 'object').length, 0);
});

test.serial('auto-check evaluates non-empty input, completes a solved blank, and emits answered xAPI', t => {
  const instance = attach({
    behaviour: { autoCheck: true },
    content: {
      blanksText: '<p>Answer ___.</p>',
      blanksList: [{
        correctAnswerText: 'yes',
        correctFeedback: '',
        hint: '',
        incorrectAnswersList: []
      }]
    }
  });
  const [input] = inputs();

  t.is(instance.__buttons['check-answer'], undefined);
  type(input, 'yes');
  input.dispatchEvent(new window.Event('blur', { bubbles: true }));

  t.is(instance.getScore(), 1);
  t.true(instance.getAnswerGiven());
  t.true(input.disabled);
  t.true(instance.__buttons['show-solution'].element.hidden);
  t.false(instance.__buttons['try-again'].element.hidden);
  const answered = instance.__events.filter(event => typeof event === 'object' && event.verb === 'answered');
  t.is(answered.length, 1);
  t.is(answered[0].data.statement.result.response, 'yes');
});

test.serial('auto-check re-evaluates restored state during attach', t => {
  const instance = attach({ behaviour: { autoCheck: true } }, { previousState: ['brown', 'swift'] });

  t.is(instance.getScore(), 2);
  t.true(instance.getAnswerGiven());
  t.true(inputs().every(input => input.disabled));
  t.is(instance.__events.filter(event => typeof event === 'object' && event.verb === 'answered').length, 1);
});

test.serial('embedded showSolutions preserves correct input and replaces incorrect input', t => {
  const instance = attach();
  const [first, second] = inputs();
  first.value = 'tan';
  second.value = 'wrong';

  instance.showSolutions();

  t.deepEqual(instance.getCurrentState(), ['tan', 'swift']);
  t.is(instance.getScore(), 1);
  t.true(inputs().every(input => input.disabled));
  t.true(instance.__buttons['check-answer'].element.hidden);
  t.true(instance.__buttons['show-solution'].element.hidden);
  t.true(instance.__buttons['try-again'].element.hidden);
});

test.serial('embedded showSolutions bypasses learner-facing input restrictions', t => {
  const instance = attach();

  instance.showSolutions();

  t.deepEqual(instance.getCurrentState(), ['brown', 'swift']);
  t.true(inputs().every(input => input.disabled));
  t.is(instance.getScore(), 0);
  t.true(instance.__buttons['check-answer'].element.hidden);
  t.true(instance.__buttons['show-solution'].element.hidden);
  t.true(instance.__buttons['try-again'].element.hidden);
});

test.serial('xAPI definition marks alternatives and reporting version', t => {
  const instance = attach();
  const event = instance.createXAPIEventTemplate('answered');

  instance.addQuestionToXAPI(event);

  t.is(
    event.data.statement.context.extensions['https://h5p.org/x-api/h5p-reporting-version'],
    '1.0.0'
  );
  t.regex(event.data.statement.object.definition.description['en-US'], /Complete the sentence/);
  t.regex(event.data.statement.object.definition.description['en-US'], /__________/);
  t.is(H5P.Question, Object.getPrototypeOf(AdvancedBlanksPapiJo.prototype).constructor);
});

const { JSDOM } = require('jsdom');

class JQueryWrapper {
  constructor(elements) {
    this.elements = elements.filter(Boolean);
    this.length = this.elements.length;
  }

  get(index) {
    return this.elements[index];
  }

  append(child) {
    const childElements = child instanceof JQueryWrapper ? child.elements : [child];
    for (const parent of this.elements) {
      for (const element of childElements) {
        parent.appendChild(element);
      }
    }
    return this;
  }

  find(selector) {
    return new JQueryWrapper(this.elements.flatMap(element => [...element.querySelectorAll(selector)]));
  }

  focus() {
    this.elements[0]?.focus();
    return this;
  }

  html(value) {
    if (value === undefined) {
      return this.elements[0]?.innerHTML;
    }
    this.elements.forEach(element => { element.innerHTML = value; });
    return this;
  }

  last() {
    return new JQueryWrapper(this.length ? [this.elements[this.length - 1]] : []);
  }

  parents(selector) {
    const parents = [];
    for (const element of this.elements) {
      let parent = element.parentElement;
      while (parent) {
        if (parent.matches(selector) && !parents.includes(parent)) {
          parents.push(parent);
        }
        parent = parent.parentElement;
      }
    }
    return new JQueryWrapper(parents);
  }

  unwrap() {
    const element = this.elements[0];
    return new JQueryWrapper(element ? [...element.childNodes] : []);
  }
}

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = deepMerge(target[key] || {}, value);
    }
    else {
      target[key] = value;
    }
  }
  return target;
}

function makeJQuery(document) {
  const jquery = (value, attributes = {}) => {
    if (value instanceof JQueryWrapper) {
      return value;
    }
    if (typeof value === 'string' && value.startsWith('<')) {
      const template = document.createElement('template');
      template.innerHTML = value.replace('/>', '>');
      const element = template.content.firstElementChild;
      for (const [name, attributeValue] of Object.entries(attributes)) {
        if (name === 'class') {
          element.className = attributeValue;
        }
        else if (name === 'html') {
          element.innerHTML = attributeValue;
        }
        else {
          element.setAttribute(name, attributeValue);
        }
      }
      return new JQueryWrapper([element]);
    }
    if (typeof value === 'string') {
      return new JQueryWrapper([...document.querySelectorAll(value)]);
    }
    return new JQueryWrapper(value ? [value] : []);
  };

  jquery.extend = (deep, target, ...sources) => {
    if (deep !== true) {
      return Object.assign(deep, target, ...sources);
    }
    for (const source of sources) {
      deepMerge(target, source);
    }
    return target;
  };

  return jquery;
}

function Question() {
  this.__buttons = {};
  this.__events = [];
  this.__feedback = null;
  this.__feedbackRemoved = 0;
  this.attach = Question.prototype.attach.bind(this);
}

Question.determineOverallFeedback = () => 'Score @score of @total';

Question.prototype.addButton = function (id, label, callback, visible, attributes, options) {
  const element = document.createElement('button');
  element.dataset.buttonId = id;
  element.textContent = label;
  element.hidden = !visible;
  element.addEventListener('click', callback);
  this.__buttons[id] = { callback, element, options };
  this.__content?.get(0)?.appendChild(element);
};

Question.prototype.attach = function ($container) {
  this.registerDomElements();
  $container.get(0).appendChild(this.__content.get(0));
};

Question.prototype.createXAPIEventTemplate = function (verb) {
  const statement = {
    context: {},
    object: { definition: {} },
    result: {}
  };
  return {
    verb,
    data: { statement },
    getVerifiedStatementValue(path) {
      return path.reduce((value, key) => value[key], statement);
    },
    setScoredResult(score, maxScore) {
      statement.result.score = { raw: score, max: maxScore };
      statement.result.success = score === maxScore;
      statement.result.completion = true;
    }
  };
};

Question.prototype.hideButton = function (id) {
  if (this.__buttons[id]) {
    this.__buttons[id].element.hidden = true;
  }
};

Question.prototype.removeFeedback = function () {
  this.__feedback = null;
  this.__feedbackRemoved++;
};

Question.prototype.setAudio = function (media) {
  this.__audio = media;
};

Question.prototype.setContent = function (content) {
  this.__content = content;
};

Question.prototype.setFeedback = function (...args) {
  this.__feedback = args;
};

Question.prototype.setImage = function (...args) {
  this.__image = args;
};

Question.prototype.setIntroduction = function (introduction) {
  this.__introduction = introduction;
};

Question.prototype.setVideo = function (media) {
  this.__video = media;
};

Question.prototype.showButton = function (id) {
  if (this.__buttons[id]) {
    this.__buttons[id].element.hidden = false;
  }
};

Question.prototype.trigger = function (event) {
  this.__events.push(event);
};

Question.prototype.triggerXAPI = function (verb) {
  this.trigger(verb);
};

const H5P = {
  JoubelSpeechBubble: function () {
    this.remove = () => {};
  },
  Question
};

function installDom() {
  const dom = new JSDOM('<!doctype html><html><body><div class="h5p-container"><div class="h5p-content" data-content-id="42"></div></div></body></html>');
  const constructors = [
    'Event',
    'HTMLButtonElement',
    'HTMLDivElement',
    'HTMLElement',
    'HTMLInputElement',
    'HTMLSelectElement',
    'HTMLSpanElement',
    'KeyboardEvent',
    'MouseEvent'
  ];
  global.window = dom.window;
  global.document = dom.window.document;
  for (const constructor of constructors) {
    global[constructor] = dom.window[constructor];
  }
  H5P.jQuery = makeJQuery(dom.window.document);
  global.H5P = H5P;
  return dom;
}

function baseConfig(overrides = {}) {
  const config = {
    behaviour: {
      mode: 'typing',
      selectAlternatives: 'alternatives',
      selectAlternativeRestriction: 5,
      enableRetry: true,
      enableSolutionsButton: true,
      enableCheckButton: true,
      autoCheck: false,
      caseSensitive: false,
      useRegex: false,
      spellingErrorBehaviour: 'mistake',
      showSolutionsRequiresInput: true,
      showAllSolutions: false,
      confirmCheckDialog: false,
      confirmRetryDialog: false
    },
    media: {
      type: null,
      disableImageZooming: false
    },
    content: {
      task: 'Complete the sentence.',
      blanksText: '<p>The !!quick!! ___ fox is ___.</p>',
      blanksList: [
        {
          correctAnswerText: 'brown/tan',
          correctFeedback: 'Correct colour',
          hint: 'A colour',
          incorrectAnswersList: [{
            incorrectAnswerText: 'red',
            incorrectAnswerFeedback: 'Not this colour',
            showHighlight: true,
            highlight: -1
          }]
        },
        {
          correctAnswerText: 'swift',
          correctFeedback: '',
          hint: '',
          incorrectAnswersList: []
        }
      ]
    },
    snippets: null,
    showSolutions: 'Show solution',
    tryAgain: 'Retry',
    checkAnswer: 'Check',
    submitAnswer: 'Submit',
    notFilledOut: 'Fill every blank first',
    tipLabel: 'Tip',
    spellingMistakeWarning: 'Check spelling: @mistake',
    scoreBarLabel: 'You got :num out of :total',
    confirmCheck: {},
    confirmRetry: {},
    overallFeedback: []
  };

  return deepMerge(config, overrides);
}

function createHost() {
  return H5P.jQuery(document.querySelector('.h5p-content'));
}

function clickButton(instance, id) {
  instance.__buttons[id].element.click();
}

module.exports = {
  H5P,
  baseConfig,
  clickButton,
  createHost,
  installDom
};

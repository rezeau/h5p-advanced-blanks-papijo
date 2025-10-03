﻿import { MessageService } from '../services/message-service';
import { ClozeElement, ClozeElementType } from './cloze-element';
import { Answer, Correctness } from './answer';
import { Message } from './message';
import { MessageType, ClozeType, SelectAlternatives } from './enums';
import { H5PLocalization, LocalizationLabels } from '../services/localization';
import { ISettings } from "../services/settings";
import { getLongestString, shuffleArray } from "../../lib/helpers";
import * as jsdiff from 'diff';

export class Blank extends ClozeElement {
  // content
  correctAnswers: Answer[];
  incorrectAnswers: Answer[];
  hint: Message;
  correctFeedback: string;
  id: string;
  choices: string[];
  hasHint: boolean;
  hasCorrectFeedback: boolean;
  tipTitle: string;

  // viewmodel stuff

  lastCheckedText: string;
  enteredText: string;
  isCorrect: boolean;
  isError: boolean;
  isRetry: boolean;
  hasPendingFeedback: boolean;
  isShowingSolution: boolean;
  message: string;
  minTextLength: number;
  currTextLength: number;
  //speechBubble;

  /**
   * Add incorrect answers after initializing the object. Call finishInitialization()
   * when done.
   * @param  {ISettings} settings
   * @param  {string} id
   * @param  {string} correctText?
   * @param  {string} correctFeedback?
   * @param  {string} hintText?
   */
  constructor(private settings: ISettings, private localization: H5PLocalization, private jquery: JQueryStatic, private messageService: MessageService, id: string) {
    super();

    this.enteredText = "";
    this.correctAnswers = [];
    this.incorrectAnswers = [];
    this.choices = [];
    this.type = ClozeElementType.Blank;
    this.id = id;
  }

  /**
  * Call this method when all incorrect answers have been added.
  */
  public finishInitialization(): void {
    if (this.settings.clozeType === ClozeType.Select && this.settings.selectAlternatives === SelectAlternatives.Alternatives) {
      this.loadChoicesFromOwnAlternatives();
    }
    this.minTextLength = 8;
    this.currTextLength = this.minTextLength;
  }

  public addCorrectAnswer(answer: Answer) {
    this.correctAnswers.push(answer);
  }

  public getCorrectAnswers(): string[] {
    let result = [];
    for (const answer of this.correctAnswers) {
      result = result.concat(answer.alternatives);
    }
    return result;
  }

  public setHint(message: Message) {
    this.hint = message;
    this.hasHint = this.hint.text !== "";
    this.tipTitle = this.localization.getTextFromLabel(LocalizationLabels.tipButton);
  }

  /**
   * Adds the incorrect answer to the list.
   * @param text - What the user must enter.
   * @param reaction  - What the user gets displayed when he enteres the text.
   */
  public addIncorrectAnswer(text: string, reaction: string, showHighlight: boolean, highlight: number): void {
    this.incorrectAnswers.push(
      new Answer(text, reaction, showHighlight, highlight, this.settings));
  }

  /**
   * Creates a list of choices from all alternatives provided by
   * the correct and incorrect answers.
   */
  private loadChoicesFromOwnAlternatives(): string[] {
    this.choices = [];
    for (const answer of this.correctAnswers) {
      for (const alternative of answer.alternatives) {
        this.choices.push(alternative);
      }
    }

    for (const answer of this.incorrectAnswers) {
      for (const alternative of answer.alternatives) {
        this.choices.push(alternative);
      }
    }

    this.choices = shuffleArray(this.choices);
    this.choices.unshift("");

    return this.choices;
  }

  /**
   * Creates a list of choices from all correct answers of the cloze.
   * @param otherBlanks All OTHER blanks in the cloze. (excludes the current one!)
   */
  public loadChoicesFromOtherBlanks(otherBlanks: Blank[]): string[] {
    const ownChoices = [];
    for (const answer of this.correctAnswers) {
      for (const alternative of answer.alternatives) {
        ownChoices.push(alternative);
      }
    }

    let otherChoices = [];
    for (const otherBlank of otherBlanks) {
      for (const answer of otherBlank.correctAnswers) {
        for (const alternative of answer.alternatives) {
          otherChoices.push(alternative);
        }
      }
    }

    otherChoices = shuffleArray(otherChoices);

    let maxChoices = this.settings.selectAlternativeRestriction;
    if (maxChoices === undefined || maxChoices === 0)
      maxChoices = ownChoices.length + otherChoices.length;

    let leftOverChoices = maxChoices - ownChoices.length;
    for (let x = 0; x < leftOverChoices && x < otherChoices.length; x++) {
      if (ownChoices.indexOf(otherChoices[x]) >= 0) {
        leftOverChoices++;
      } else {
        ownChoices.push(otherChoices[x]);
      }
    }

    this.choices = shuffleArray(ownChoices);
    this.choices.unshift("");

    return this.choices;
  }

  /**
  * Clears the blank from all entered text and hides popups.
  */
  public reset() {
    this.enteredText = "";
    this.lastCheckedText = "";
    this.removeTooltip();
    this.setAnswerState(MessageType.None);
    this.hasPendingFeedback = false;
  }

  /**
   * Sets the blank to a state in which the correct solution if shown if the user
   * hasn't entered a correct one so far.
   */
  public showSolution() {
    this.evaluateAttempt(true);
    this.removeTooltip();
    if (this.isCorrect)
      return;
    this.hasPendingFeedback = false;
    
    if (this.settings.showAllSolutions) {
      this.enteredText = this.correctAnswers[0].alternatives.join(" | ");
    } else {
      this.enteredText = this.correctAnswers[0].alternatives[0];
    }
    this.setAnswerState(MessageType.ShowSolution);

  }

  public onFocused() {
    if (this.hasPendingFeedback) {
      this.evaluateAttempt(false);
    }
    if (this.settings.clozeType === ClozeType.Select) {
      this.setAnswerState(MessageType.None);
      this.lastCheckedText = "";
    }
  }

  public onDisplayFeedback() {
    if (this.hasPendingFeedback) {
      this.evaluateAttempt(false);
    }
  }

  private displayTooltip(message: string, type: MessageType, surpressTooltip: boolean, id?: string) {
    if (!surpressTooltip)
      this.messageService.show(id ? id : this.id, message, this, type);
    else {
      this.hasPendingFeedback = true;
    }
  }

  public removeTooltip() {
    this.messageService.hide();
  }

  private setTooltipErrorText(message: Message, surpressTooltip: boolean) {
    if (message.highlightedElement) {
      this.displayTooltip(message.text, MessageType.Error, surpressTooltip, message.highlightedElement.id);
    }
    else {
      this.displayTooltip(message.text, MessageType.Error, surpressTooltip);
    }
  }

  private getSpellingMistakeMessage(expectedText: string, enteredText: string): string {
    let message = this.localization.getTextFromLabel(LocalizationLabels.typoMessage)

    const diff = jsdiff.diffChars(expectedText, enteredText, { ignoreCase: !this.settings.caseSensitive });

    const mistakeSpan = this.jquery("<span/>", { "class": "spelling-mistake" });
    for (let index = 0; index < diff.length; index++) {
      const part = diff[index];
      let spanClass = '';
      if (part.removed) {
        if (index === diff.length - 1 || !diff[index + 1].added) {
          part.value = part.value.replace(/./g, "_");
          spanClass = 'missing-character';
        }
        else {
          continue;
        }
      }
      if (part.added) {
        spanClass = 'mistaken-character';
      }

      const span = this.jquery("<span/>", { "class": spanClass, "html": part.value.replace(" ", "&nbsp;") });
      mistakeSpan.append(span);
    }

    message = message.replace("@mistake", this.jquery("<span/>").append(mistakeSpan).html());
    return message;
  }

  /**
   * Checks if the entered text is the correct answer or one of the 
   * incorrect ones and gives the user feedback accordingly.
   */
  public evaluateAttempt(surpressTooltips: boolean, forceCheck?: boolean) {
    if (!this.hasPendingFeedback && this.lastCheckedText === this.enteredText && !forceCheck)
      return;
    const useRegex = this.settings.useRegex;
    this.lastCheckedText = this.enteredText.toString();
    this.hasPendingFeedback = false;
    this.removeTooltip();
    
    // Set checkCorrectness = true in order to detect that we are checking correct answers in answer.evaluateAttempt
    let checkCorrectness = true;
    const exactCorrectMatches = this.correctAnswers.map(answer => answer.evaluateAttempt(this.enteredText, checkCorrectness)).filter(evaluation => evaluation.correctness === Correctness.ExactMatch).sort(evaluation => evaluation.characterDifferenceCount);
    // Done, now we can set checkCorrectness to false and test incorrect answers
    checkCorrectness = false;
    
    const closeCorrectMatches = this.correctAnswers.map(answer => answer.evaluateAttempt(this.enteredText, checkCorrectness)).filter(evaluation => evaluation.correctness === Correctness.CloseMatch).sort(evaluation => evaluation.characterDifferenceCount);
    const exactIncorrectMatches = this.incorrectAnswers.map(answer => answer.evaluateAttempt(this.enteredText, checkCorrectness)).filter(evaluation => evaluation.correctness === Correctness.ExactMatch).sort(evaluation => evaluation.characterDifferenceCount);
    const closeIncorrectMatches = this.incorrectAnswers.map(answer => answer.evaluateAttempt(this.enteredText, checkCorrectness)).filter(evaluation => evaluation.correctness === Correctness.CloseMatch).sort(evaluation => evaluation.characterDifferenceCount);

    if (exactCorrectMatches.length > 0) {
      this.setAnswerState(MessageType.Correct);
      if (this.hasCorrectFeedback) {
        this.displayTooltip(this.correctFeedback, MessageType.Correct, surpressTooltips);
      }
      if (!this.settings.caseSensitive) {
        this.enteredText = exactCorrectMatches[0].usedAlternative;
      }
      return;
    }

    if (exactIncorrectMatches.length > 0) {
      if(!useRegex) {
        this.setAnswerState(MessageType.Error);
        this.showErrorTooltip(exactIncorrectMatches[0].usedAnswer, surpressTooltips);
        return;
      } else {
        const catchAll = exactIncorrectMatches[0].usedAnswer.alternatives[0];
        if (catchAll === '.*' && closeCorrectMatches.length > 0 && this.settings.warnSpellingErrors) {
          this.displayTooltip(this.getSpellingMistakeMessage(closeCorrectMatches[0].usedAlternative, this.enteredText), MessageType.Retry, surpressTooltips);
          this.setAnswerState(MessageType.Retry);
        } else {
          this.setAnswerState(MessageType.Error);
          this.showErrorTooltip(exactIncorrectMatches[0].usedAnswer, surpressTooltips);
        }
        return;
      }
    }

    if (closeCorrectMatches.length > 0) {
      if (this.settings.warnSpellingErrors) {
        this.displayTooltip(this.getSpellingMistakeMessage(closeCorrectMatches[0].usedAlternative, this.enteredText), MessageType.Retry, surpressTooltips);
        this.setAnswerState(MessageType.Retry);
        return;
      }
      if (this.settings.acceptSpellingErrors) {
        this.setAnswerState(MessageType.Correct);
        this.enteredText = closeCorrectMatches[0].usedAlternative;
        return;
      }
    }

    if (closeIncorrectMatches.length > 0) {
      this.setAnswerState(MessageType.Error);
      this.showErrorTooltip(closeIncorrectMatches[0].usedAnswer, surpressTooltips);
      return;
    }

    const alwaysApplyingAnswers = this.incorrectAnswers.filter(a => a.appliesAlways);
    if (alwaysApplyingAnswers && alwaysApplyingAnswers.length > 0) {
      this.showErrorTooltip(alwaysApplyingAnswers[0], surpressTooltips);
    }

    this.setAnswerState(MessageType.Error);
  }

  public onTyped(): void {
    this.setAnswerState(MessageType.None);
    this.lastCheckedText = "";
    this.removeTooltip();
  }

  public lostFocus(): void {
    if (this.messageService.isActive(this)) {
      this.messageService.hide();
    }
  }

  /**
   * Sets the boolean properties isCorrect, is Error, isRetry and isShowingSolution according to the passed  messageType.
   * @param messageType 
   */
  private setAnswerState(messageType: MessageType) {
    this.isCorrect = false;
    this.isError = false;
    this.isRetry = false;
    this.isShowingSolution = false;

    switch (messageType) {
      case MessageType.Correct:
        this.isCorrect = true;
        break;
      case MessageType.Error:
        this.isError = true;
        break;
      case MessageType.Retry:
        this.isRetry = true;
        break;
      case MessageType.ShowSolution:
        this.isShowingSolution = true;
        break;
    }
  }

  private showErrorTooltip(answer: Answer, surpressTooltip: boolean) {
    if (answer.message && answer.message.text) {
      this.setTooltipErrorText(answer.message, surpressTooltip);
    }
    if (!surpressTooltip) {
      answer.activateHighlight();
    }
  }

  /**
   * Displays the hint in the tooltip.
   */
  public showHint() {
    if (this.isShowingSolution || this.isCorrect) {
      return;
    }
    if (this.hint && this.hint.text !== "") {
      this.displayTooltip(this.hint.text, MessageType.Retry, false);
      if (this.hint.highlightedElement) {
        this.hint.highlightedElement.isHighlighted = true;
      }
    }
  }

  public serialize() {
    return this.enteredText;
  }

  public deserialize(data: string) {
    this.enteredText = data;
  }
}
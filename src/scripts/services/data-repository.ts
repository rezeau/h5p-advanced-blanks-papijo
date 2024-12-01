import { BlankLoader } from '../content-loaders/blank-loader';
import { Blank } from "../models/blank";
import { Snippet } from "../models/snippet";
import { ISettings } from "../services/settings";
import { H5PLocalization } from "./localization";
import { Unrwapper } from '../helpers/unwrapper';
import { checkBalancedBrackets, replaceDoubleExclamations, checkBalancedHighlightMarkers } from "../../lib/helpers";

export interface IDataRepository {
  getBlanks(): Blank[];
  getClozeText(): string;
  getFeedbackText(): string;
  getMedia();
  getTaskDescription(): string;
  getSnippets(): Snippet[];
}

/**
 * Wraps around the h5p config object and provides access to the content.
 */
export class H5PDataRepository implements IDataRepository {
  constructor(private h5pConfigData, private settings: ISettings,
    private localization: H5PLocalization, private jquery: JQueryStatic, 
    private unwrapper: Unrwapper) {

  }

  /**
   * Returns the blank text of the cloze (as HTML markup).
   */
  getClozeText(): string {
    // Replace !!*!! old highlighted markers with new [[*]] markers.
    const clozeText = replaceDoubleExclamations(this.h5pConfigData.content.blanksText);
    const checkHighlightMarkers = checkBalancedHighlightMarkers(clozeText);
    if (checkHighlightMarkers !== '') {
      this.settings.highlightMarkersError = true;
      this.settings.highlightMarkersErrorMessage = 'ERROR in your Blanks text:' + checkHighlightMarkers + 'Your <span class="highlighted unpaired">highlight delimiters</span> are not correctly balanced';
      return '';
    }
    else {
      return this.h5pConfigData.content.blanksText;
    }
  }

  // TODO: remove or implement
  getFeedbackText(): string {
    return "";
  }

  getMedia() {
    return this.h5pConfigData.media.type;
  }

  getTaskDescription(): string {
    return this.h5pConfigData.content.task;
  }

  getBlanks(): Blank[] {
    const blanks: Blank[] = [];
    const ESCAPED_SLASH_REPLACEMENT = '\u250C'; // no-width space character
      
    if (!this.h5pConfigData.content.blanksList)
      return blanks;

    // If use RegExp then check Balanced Brackets.
    if (this.h5pConfigData.behaviour.useRegex) {
      const unBalancedBrackets = [];
      for (let i = 0; i < this.h5pConfigData.content.blanksList.length; i++) {
        const h5pBlank = this.h5pConfigData.content.blanksList[i];
        const correctText = h5pBlank.correctAnswerText;
        if (correctText === "" || correctText === undefined)
          continue;
        if (h5pBlank.incorrectAnswersList) {
          const incorrectAnswersList = [];
          for (const incorrectAnswer of h5pBlank.incorrectAnswersList) {
            incorrectAnswersList.push(incorrectAnswer.incorrectAnswerText);
          }
          const checkBrackets = checkBalancedBrackets(incorrectAnswersList);
          if (checkBrackets !== null) {
            unBalancedBrackets.push('<em>Blank # ' + (i + 1) + ' ⇒ ' + correctText + '</em>', '<span class="highlighted">'+ checkBrackets + '</span>');
          }
          if (unBalancedBrackets.length !== 0) {
            this.settings.regexpError = true;
            this.settings.regexpErrorMessage = this.h5pConfigData.content.blanksText + 'ERROR- Your round or square brackets are not correctly balanced in the following Incorrect answers <span class="highlighted">regular expression(s)</span>: <br>' + unBalancedBrackets.join('<br>') + '<br><br>';
          }
        }
      }
    }

    for (let i = 0; i < this.h5pConfigData.content.blanksList.length; i++) {
      const h5pBlank = this.h5pConfigData.content.blanksList[i];
        let incorrectAnswersList = [];

      let correctText = h5pBlank.correctAnswerText;
      
      const correctFeedback = h5pBlank.correctFeedback;
      if (correctText === "" || correctText === undefined)
        continue;
      // Deal with potential escaped forward slash in correct & incorrect answers.
      const re = /\\\//g;
      if (correctText.match(re)) {
        correctText = correctText.replace(re, ESCAPED_SLASH_REPLACEMENT);
      }
      if (h5pBlank.incorrectAnswersList) {
        // Find if there is at least one occurrence of re in the list of incorrect answers.
        if (h5pBlank.incorrectAnswersList.some(e => e.incorrectAnswerText.match(re))) {
          for (const incorrectAnswer of h5pBlank.incorrectAnswersList) {
            incorrectAnswer.incorrectAnswerText = incorrectAnswer.incorrectAnswerText.replace(re, ESCAPED_SLASH_REPLACEMENT);
            incorrectAnswersList.push(incorrectAnswer);
          }
        } else {
          incorrectAnswersList = h5pBlank.incorrectAnswersList;
        }
      }
      const blank = BlankLoader.instance.createBlank("cloze" + i, correctText, correctFeedback,
        h5pBlank.hint, incorrectAnswersList);

      blank.finishInitialization();
      blanks.push(blank);
    }

    return blanks;
  }

  getSnippets(): Snippet[] {
    const snippets: Snippet[] = [];

    if (!this.h5pConfigData.snippets)
      return snippets;

    for (let i = 0; i < this.h5pConfigData.snippets.length; i++) {
      const raw_snippet = this.h5pConfigData.snippets[i];
      const snippet = new Snippet(raw_snippet.snippetName, this.unwrapper.unwrap(raw_snippet.snippetText));
      snippets.push(snippet);
    }
    return snippets;
  }
}
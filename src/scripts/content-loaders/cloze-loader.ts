import { BlankLoader } from './blank-loader';
import { ClozeElement, ClozeElementType } from '../models/cloze-element';
import { Blank } from '../models/blank';
import { Highlight } from '../models/highlight';
import { Cloze } from "../models/cloze";
import { replaceDoubleExclamations } from "../../lib/helpers";

/**
 * Loads a cloze object.
 */
export class ClozeLoader {
  private static normalizedBlankMarker = '___';
  
  /**
   * @param  {string} html - The html string that contains the cloze with blanks marking and highlight markings.
   * @param  {Blank[]} blanks - All blanks as entered by the content author.
   * @returns Cloze
   */
  public static createCloze(html: string, blanks: Blank[]): Cloze {
    let orderedAllElementsList: ClozeElement[] = [];
    let highlightInstances: Highlight[] = [];
    let blanksInstances: Blank[] = [];
    // Replace !!*!! old highlighted markers with new [[*]] markers.
    html = replaceDoubleExclamations(html);

    const highlightMarkersError = blanks[0]['settings']['highlightMarkersError'];
    const regexpError = blanks[0]['settings']['regexpError'];
    if (regexpError || highlightMarkersError) {
      html = blanks[0]['settings']['regexpErrorMessage'] + blanks[0]['settings']['highlightMarkersErrorMessage'];
      // Remove the "Check" button from interface.
      const element = document.querySelector('.h5p-question-check-answer');
      if (element) {
        (element as HTMLElement).style.display = 'none';
      }
    }
    if (!highlightMarkersError && !regexpError) {
      html = ClozeLoader.normalizeBlankMarkings(html);
      const conversionResult = ClozeLoader.convertMarkupToSpans(html, blanks);
      html = conversionResult.html;
      orderedAllElementsList = conversionResult.orderedAllElementsList;
      highlightInstances = conversionResult.highlightInstances;
      blanksInstances = conversionResult.blanksInstances;
    
      ClozeLoader.linkHighlightsObjects(orderedAllElementsList, highlightInstances, blanksInstances);
    }
    const cloze = new Cloze();
    cloze.html = html;
    cloze.blanks = blanksInstances;
    cloze.highlights = highlightInstances;

    return cloze;
  }

   /**
   * Converts !!signal!! highlight markup and ___  blank markup into <span>...</span>.
   * Returns the resulting html string and three lists of all active elements used in the cloze:
   *    orderedAllElements: highlights and blanks in the order of appearance in the html.
   *    highlightInstances: only highlights in the order of appearance
   *    blanksInstances: only blanks in the order of appearance
   * @param  {string} html
   * @param  {Blank[]} blanks
   * @returns Lists of active elements (see description).
   */
  private static convertMarkupToSpans(html: string, blanks: Blank[]): { html: string, orderedAllElementsList: ClozeElement[], highlightInstances: Highlight[], blanksInstances: Blank[] } {
    const orderedAllElementsList: ClozeElement[] = [];
    const highlightInstances: Highlight[] = [];
    const blanksInstances: Blank[] = [];

    const exclamationMarkRegExp = /\[\[(.{1,40}?)\]\]/i;
    let highlightCounter = 0;
    let blankCounter = 0;
    let nextHighlightMatch;
    let nextBlankIndex;

    // Searches the html string for highlights and blanks and inserts spans. 
    do {
      nextHighlightMatch = html.match(exclamationMarkRegExp);
      nextBlankIndex = html.indexOf(ClozeLoader.normalizedBlankMarker);

      if (nextHighlightMatch && ((nextHighlightMatch.index < nextBlankIndex) || (nextBlankIndex < 0))) {
        // next active element is a highlight
        const highlight = new Highlight(nextHighlightMatch[1], `highlight_${highlightCounter}`);
        highlightInstances.push(highlight);
        orderedAllElementsList.push(highlight);
        html = html.replace(exclamationMarkRegExp, `<span id='container_highlight_${highlightCounter}'></span>`);
        highlightCounter++;
      } else if (nextBlankIndex >= 0) {
        // next active element is a blank
        if (blankCounter >= blanks.length) {
          // if the blank is not in the repository (The content author has marked too many blanks in the text, but not entered correct answers.)
          html = html.replace(ClozeLoader.normalizedBlankMarker, "<span></span>");
        }
        else {
          const blank = blanks[blankCounter];
          blanksInstances.push(blank);
          orderedAllElementsList.push(blank);
          html = html.replace(ClozeLoader.normalizedBlankMarker, `<span id='container_${blank.id}'></span>`);
          blankCounter++;
        }
      }
    }
    while (nextHighlightMatch || (nextBlankIndex >= 0));

    return {
      html: html,
      orderedAllElementsList: orderedAllElementsList,
      highlightInstances: highlightInstances,
      blanksInstances: blanksInstances
    };
  }

  /**
   * Looks for all instances of marked blanks and replaces them with ___. 
   * @param  {string} html
   * @returns string
   */
  private static normalizeBlankMarkings(html: string): string {
    const underlineBlankRegEx = /_{3,}/g;
    html = html.replace(underlineBlankRegEx, ClozeLoader.normalizedBlankMarker);
    return html;
  }

   /**
   * Iterates through all blanks and calls their linkHighlightIdsToObjects(...).
   * @param orderedAllElementsList 
   * @param highlightInstances 
   * @param blanksInstances 
   */
  private static linkHighlightsObjects(orderedAllElementsList: ClozeElement[], highlightInstances: Highlight[], blanksInstances: Blank[]): void {
    for (const blank of blanksInstances) {
      const nextBlankIndexInArray = orderedAllElementsList.indexOf(blank);
      const highlightsBeforeBlank = orderedAllElementsList
        .slice(0, nextBlankIndexInArray)
        .filter(e => e.type === ClozeElementType.Highlight)
        .map(e => e as Highlight)
        .reverse();
      const highlightsAfterBlank = orderedAllElementsList
        .slice(nextBlankIndexInArray + 1)
        .filter(e => e.type === ClozeElementType.Highlight)
        .map(e => e as Highlight);
      BlankLoader.instance.linkHighlightIdToObject(blank, highlightsBeforeBlank, highlightsAfterBlank);
    }
  }
}
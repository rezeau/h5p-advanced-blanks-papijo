﻿import { ClozeType, SelectAlternatives } from "../models/enums";

export interface ISettings {
  clozeType: ClozeType;
  selectAlternatives: SelectAlternatives;
  selectAlternativeRestriction: number;
  enableRetry: boolean;
  enableSolutionsButton: boolean;
  enableCheckButton: boolean;
  autoCheck: boolean;
  caseSensitive: boolean;
  useRegex: boolean;
  warnSpellingErrors: boolean;
  acceptSpellingErrors: boolean;
  showSolutionsRequiresInput: boolean;
  showAllSolutions: boolean;
  confirmCheckDialog: boolean;
  confirmRetryDialog: boolean;
  disableImageZooming: boolean;
  regexpError: boolean;
  regexpErrorMessage: string;
  highlightMarkersError: boolean;
  highlightMarkersErrorMessage: string;
}

export class H5PSettings implements ISettings {
  public clozeType: ClozeType = ClozeType.Type;
  public selectAlternatives: SelectAlternatives = SelectAlternatives.Alternatives;
  public selectAlternativeRestriction: number = 5;
  public enableRetry: boolean = true;
  public enableSolutionsButton: boolean = true;
  public enableCheckButton: boolean = true;
  public autoCheck: boolean = false;
  public caseSensitive: boolean = false;
  public useRegex: boolean = false;
  public warnSpellingErrors: boolean = true;
  public acceptSpellingErrors: boolean = false;
  public showSolutionsRequiresInput: boolean = true;
  public showAllSolutions: boolean = false;
  public confirmCheckDialog: boolean = false;
  public confirmRetryDialog: boolean = false;
  public disableImageZooming: boolean = false;
  public regexpError: boolean = false;
  public regexpErrorMessage: string = '';
  public highlightMarkersError: boolean = false;
  public highlightMarkersErrorMessage: string = '';

  constructor(h5pConfigData) {
    if (h5pConfigData.behaviour.mode === 'selection') {
      this.clozeType = ClozeType.Select;
    }
    else {
      this.clozeType = ClozeType.Type;
    }

    if (h5pConfigData.behaviour.selectAlternatives === 'all') {
      this.selectAlternatives = SelectAlternatives.All;
    } else if (h5pConfigData.behaviour.selectAlternatives === 'alternatives') {
      this.selectAlternatives = SelectAlternatives.Alternatives;
    }
    else {
      this.selectAlternatives = SelectAlternatives.All;
    }

    this.selectAlternativeRestriction = h5pConfigData.behaviour.selectAlternativeRestriction;
    this.enableRetry = h5pConfigData.behaviour.enableRetry;
    this.enableSolutionsButton = h5pConfigData.behaviour.enableSolutionsButton;
    this.enableCheckButton = h5pConfigData.behaviour.enableCheckButton;
    this.autoCheck = h5pConfigData.behaviour.autoCheck;
    this.caseSensitive = h5pConfigData.behaviour.caseSensitive;
    this.useRegex = h5pConfigData.behaviour.useRegex;
    this.warnSpellingErrors = h5pConfigData.behaviour.spellingErrorBehaviour === "warn";
    this.acceptSpellingErrors = h5pConfigData.behaviour.spellingErrorBehaviour === "accept";
    this.showSolutionsRequiresInput = h5pConfigData.behaviour.showSolutionsRequiresInput;
    this.showAllSolutions = h5pConfigData.behaviour.showAllSolutions;
    this.confirmCheckDialog = h5pConfigData.behaviour.confirmCheckDialog;
    this.confirmRetryDialog = h5pConfigData.behaviour.confirmRetryDialog;
    this.disableImageZooming = h5pConfigData.media.disableImageZooming;

    this.enforceLogic();
  }

  /**
   * This method sets sensible default values for settings hidden with showWhen
   */
  private enforceLogic() {
    if (this.clozeType === ClozeType.Type) {
      this.selectAlternatives = SelectAlternatives.All;
      this.selectAlternativeRestriction = 0;
      if (this.useRegex) {
        this.acceptSpellingErrors = false;
      }
      if (this.autoCheck) {
        this.confirmCheckDialog = false;
        this.confirmRetryDialog = false;
      }
    } else {
      if (this.selectAlternativeRestriction === SelectAlternatives.Alternatives) {
        this.selectAlternativeRestriction = 0;
      }
      this.warnSpellingErrors = false;
      this.acceptSpellingErrors = false;
      this.caseSensitive = false;
      this.useRegex = false;
      this.showAllSolutions = false;
    }
  }
}
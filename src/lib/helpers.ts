export function getLongestString(strings: string[]): string {
  return strings.reduce((prev, current) => current.length > prev.length ? current : prev, "");
}

export function shuffleArray(array: string[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

export function checkBalancedBrackets(alternatives) {
  let balancedBrackets = true;
  const wrongAlternatives = [];
  for (const alternative of alternatives) {
    if (alternative) {
      let parensOpen = 0;
      let parensClose = 0;
      let sqbracketsOpen = 0;
      let sqbracketsClose = 0;
      // Walk the $myregexp string to find parentheses and square brackets.
      for (let $i = 0; $i < alternative.length; $i++) {
        switch (alternative[$i]) {
            case '(': parensOpen++;
              break;
            case ')': if (parensOpen) {parensOpen--;} else{parensClose++};
              break;
            case '[': sqbracketsOpen++;
              break;
            case ']': if (sqbracketsOpen) {sqbracketsOpen--} else{sqbracketsClose++};
              break;
            default:
              break;
        }
      }       
      if (parensOpen !== 0 || parensClose !== 0 || sqbracketsOpen !== 0 || sqbracketsClose !== 0) {
        balancedBrackets = false;
        wrongAlternatives.push(alternative);
      }
    }
  }
  if (balancedBrackets) {
    return null;
  }
  return wrongAlternatives.join('\n');
}

/* Check that highlighted words markers are correctly balanced: [[...]] */
export function checkBalancedHighlightMarkers(input: string): string {
    // Regular expression to match pairs of [[...]] or standalone [[ or ]]
    const exclamationPattern = /\[\[(.*?)\]\]|\]\]|\[\[/g;

    // Variables for tracking and constructing the transformed string
    let transformedString = "";
    let lastIndex = 0;
    let hasUnbalanced = false; // Flag to track if unbalanced pairs exist

    // Match all instances of [[ or ]] in the string
    let match;
    while ((match = exclamationPattern.exec(input)) !== null) {
        const startIndex = match.index; // Start position of the current match
        const fullMatch = match[0];    // Entire matched string

        // Add text between the last match and this match to the transformed string
        transformedString += input.slice(lastIndex, startIndex);

        if (match[1] !== undefined) {
            // Balanced pair, keep as is
            transformedString += fullMatch;
        } else {
            // Unpaired [[ or ]], wrap in unpairedhighlighted span
            transformedString += `<span class="highlighted unpaired">${fullMatch}</span>`;
            hasUnbalanced = true; // Mark unbalanced pairs
        }

        // Update last processed index
        lastIndex = startIndex + fullMatch.length;
    }

    // Append any remaining text after the last match
    transformedString += input.slice(lastIndex);

    // If no unbalanced [[...]] were found, return an empty string
    return hasUnbalanced ? transformedString : "";
}

export function replaceDoubleExclamations(input: string): string {
    // Regular expression to find all occurrences of "!!"
    const exclamationPattern = /!!/g;

    // Counter to toggle between opening "[[" and closing "]]"
    let toggle = true;

    // Replace each "!!" with "[[" or "]]" alternately
    const transformedString = input.replace(exclamationPattern, () => {
        if (toggle) {
            toggle = false;
            return "[[";
        } else {
            toggle = true;
            return "]]";
        }
    });

    return transformedString;
  }
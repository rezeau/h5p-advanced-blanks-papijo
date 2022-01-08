export function getLongestString(strings: string[]): string {
  return strings.reduce((prev, current) => current.length > prev.length ? current : prev, "");
}

export function shuffleArray(array: any[]) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

export function checkBalancedBrackets(alternatives) {
  let balancedBrackets = true;
  var wrongAlternatives = [];
  for (var alternative of alternatives) {
    if (alternative) {
      var parensOpen = 0;
      var parensClose = 0;
      var sqbracketsOpen = 0;
      var sqbracketsClose = 0;
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

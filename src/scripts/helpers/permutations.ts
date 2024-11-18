/**
 * Creates a list of all possible permutations of a list of lists.
 * @param list The list to permute over.
 */
export function createPermutations(list: any[][]): any[][] {
  let output: any[][] = [[]];
  for (const currentSublist of list) {
    const newOutput = [];
    for (const sublistObject of currentSublist) {
      for (const o of output) {
        const newList = o.slice();
        newList.push(sublistObject)
        newOutput.push(newList);
      }
    }
    output = newOutput;
  }
  return output;
}
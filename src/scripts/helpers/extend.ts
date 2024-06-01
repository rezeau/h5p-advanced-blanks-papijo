/**
 * Extend an array just like JQuery's extend.
 * @param {object} arguments Objects to be merged.
 * @return {object} Merged objects.
 */
/*
export function extend(...args: any[]) {
  for (let i = 1; i < args.length; i++) {
    for (let key in args[i]) {
      if (args[i].hasOwnProperty(key)) {
        if (typeof args[0][key] === 'object' && typeof args[i][key] === 'object') {
          this.extend(args[0][key], args[i][key]);
        }
        else {
          args[0][key] = args[i][key];
        }
      }
    }
  }
  return args[0];
}

export function extend(...args: any[]) {
  function extendObjects(target: any, source: any) {
    for (let key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof target[key] === 'object' && typeof source[key] === 'object') {
          extendObjects(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }

  for (let i = 1; i < args.length; i++) {
    extendObjects(args[0], args[i]);
  }
  
  return args[0];
}
*/
export function extend(...args: any[]) {
  function extendObjects(target: any, source: any) {
    for (let key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof target[key] === 'object' && typeof source[key] === 'object') {
          extendObjects(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }

  for (let i = 1; i < args.length; i++) {
    extendObjects(args[0], args[i]);
  }
  
  return args[0];
}

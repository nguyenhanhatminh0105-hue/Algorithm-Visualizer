export function generateStringProblem(size) {
  const alphabet = 'ABCDE';
  let text = '';
  for (let i = 0; i < size; i++) text += alphabet[Math.floor(Math.random() * alphabet.length)];
  const patternLength = Math.max(2, Math.floor(size / 6));
  const startIdx = Math.floor(Math.random() * (size - patternLength));
  const pattern = text.slice(startIdx, startIdx + patternLength);
  return { text, pattern };
}

function snapshot(text, pattern, textIndex, patternIndex, matches) {
  return { text, pattern, textIndex, patternIndex, matches: [...matches] };
}

export function* naiveSearch({ text, pattern }) {
  const matches = [];
  for (let i = 0; i <= text.length - pattern.length; i++) {
    let j = 0;
    while (j < pattern.length && text[i + j] === pattern[j]) {
      yield snapshot(text, pattern, i + j, j, matches);
      j++;
    }
    if (j === pattern.length) matches.push(i);
    yield snapshot(text, pattern, i + j, j, matches);
  }
  return snapshot(text, pattern, text.length, 0, matches);
}

function buildFailureTable(pattern) {
  const table = Array(pattern.length).fill(0);
  let len = 0;
  let i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      table[i++] = ++len;
    } else if (len > 0) {
      len = table[len - 1];
    } else {
      table[i++] = 0;
    }
  }
  return table;
}

export function* kmpSearch({ text, pattern }) {
  const table = buildFailureTable(pattern);
  const matches = [];
  let i = 0;
  let j = 0;
  while (i < text.length) {
    yield snapshot(text, pattern, i, j, matches);
    if (text[i] === pattern[j]) {
      i++;
      j++;
      if (j === pattern.length) {
        matches.push(i - j);
        j = table[j - 1];
      }
    } else if (j > 0) {
      j = table[j - 1];
    } else {
      i++;
    }
  }
  return snapshot(text, pattern, i, j, matches);
}

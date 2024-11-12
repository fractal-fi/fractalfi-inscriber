import * as crypto from 'crypto';

function getRandomValues(array) {
  return crypto.webcrypto.getRandomValues(array);
}

if (typeof global.crypto !== 'object') {
  global.crypto = {
    ...crypto,
    getRandomValues: getRandomValues,
    subtle: null,
  };
}
if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = getRandomValues;
}

const throwException = (message, error) => {
  console.log(`Error:\n \n${message}:`, error, '\n \n');

  if (!error) {
    throw new Error(message);
  }

  let errorMessage = message;
  if (typeof error === 'object') {
    errorMessage += `: ${JSON.stringify(error)}`;
  } else {
    errorMessage += `: ${error}}`;
  }
  throw new Error(errorMessage);
};

const debugLog = (message, info) => {
  if (!info) {
    console.log(`Debug:\n \n${message}`, '\n \n');
  } else {
    console.log(`Debug:\n \n${message}:`, info, '\n \n');
  }
};

module.exports = {
  debugLog,
  throwException,
};

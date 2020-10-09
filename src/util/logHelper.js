const logType = {
  ERROR: 'Error',
  DEBUG: 'Debug',
};

const log = (type, message, info) => {
  if (!info) {
    console.log(`\n \n##### ${type}: ${message}`, '\n \n');
  } else if (typeof info === 'object') {
    console.log(`\n \n##### ${type}: ${message}\n`, `\n${JSON.stringify(info, null, 2)}`, '\n \n');
  } else {
    console.log(`\n \n##### ${type}: ${message}:`, info, '\n \n');
  }
};

const throwException = (message, error) => {
  log(logType.ERROR, message, error);

  if (!error) {
    throw new Error(message);
  }

  let errorMessage = message;
  if (typeof error === 'object' && Object.keys(error).length > 0) {
    errorMessage += `: ${JSON.stringify(error)}`;
  } else {
    errorMessage += `: ${error}`;
  }
  throw new Error(errorMessage);
};

const debugLog = (message, info) => {
  log(logType.DEBUG, message, info);
};

let isLogged = false;
const requestLog = (securityHandler, req) => {
  const {
    method,
    url,
    body,
    authorization,
  } = req;
  if (!isLogged) {
    log(logType.DEBUG, 'Received Request', {
      method,
      url,
      body,
      authorization,
      env: req.context.env,
    });
  }
  isLogged = true;
  log(logType.DEBUG, `In '${securityHandler}' handler`);
};

module.exports = {
  debugLog,
  requestLog,
  throwException,
};

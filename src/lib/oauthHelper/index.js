const base64 = require('./base64');
const rs = require('./jsrsasign-rsa-min');

const algorithmMap = {
  RS256: 'RSA-SHA256',
};

const typeMap = {
  RS256: 'sign',
};

function getPemPubKey(str) {
  const hex = rs.pemtohex(str);
  const key = new rs.RSAKey();
  key.readPKCS8PubKeyHex(hex);

  return key;
}

function rs256verify(input, pubkey, signature) {
  const sig = new rs.KJUR.crypto.Signature({ alg: 'SHA256withRSA' });
  sig.init(getPemPubKey(pubkey));
  sig.updateString(input);

  const isValid = sig.verify(rs.b64utohex(signature));
  return isValid;
}

function verifySignature(input, key, method, type, signature) {
  if (type === 'sign') {
    return (rs256verify(input, key, signature));
  }

  throw new Error('Algorithm type not recognized');
}

const decode = (token, key, noVerify, algorithm) => {
  if (!token) {
    throw new Error('No token supplied');
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new Error('Not enough or too many segments');
  }

  const headerSeg = segments[0];
  const payloadSeg = segments[1];
  const signatureSeg = segments[2];

  const header = JSON.parse(base64.urlDecode(headerSeg));
  const payload = JSON.parse(base64.urlDecode(payloadSeg));

  if (!noVerify) {
    const signingMethod = algorithmMap[algorithm || header.alg];
    const signingType = typeMap[algorithm || header.alg];
    if (!signingMethod || !signingType) {
      throw new Error('Algorithm not supported');
    }

    const signingInput = [headerSeg, payloadSeg].join('.');
    if (!verifySignature(signingInput, key, signingMethod, signingType, signatureSeg)) {
      throw new Error('Signature verification failed');
    }

    if (payload.nbf && Date.now() < payload.nbf * 1000) {
      throw new Error('Token not yet active');
    }

    if (payload.exp && Date.now() > payload.exp * 1000) {
      throw new Error('Token expired');
    }
  }

  return payload;
};

const validate = (token, pubkey, scopes) => {
  const payload = decode(token, pubkey);

  if (!payload.scope) {
    throw new Error('missing scopes');
  }

  if (scopes) {
    const hasScope = scopes.reduce((acc, s) => acc
      || (payload.scope.toString().indexOf(s) !== -1), false);

    if (!hasScope) {
      throw new Error('does not have required scope');
    }
  }
};

module.exports = {
  validate,
};

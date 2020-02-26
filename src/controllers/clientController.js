/* eslint-disable */
const response = require('@mimik/edge-ms-helper/response-helper');

const makeClientProcessor = require('../processors/clientProcessor');

const { rpAuth } = require('../lib/edgeCrypt');

const updateClientStatus = (req, res) => {
  const { context, swagger } = req;
  const { jwt, payload } = context.security.token;
  const { status } = swagger.params.newClientStatus;
  const expiresIn = payload.exp - payload.iat;

  


  
























  // makeClientProcessor(context)
  //   .updateClientStatus(status, jwt, expiresIn)
  //   .then(() => {
  //     const responseObj = status === 'active' ? {
  //       status: 'active',
  //       inactiveAfter: payload.exp,
  //     } : {
  //       status: 'inactive',
  //     };
  //     response.sendResult(responseObj, 200, res);
  //   })
  //   .fail((err) => {
  //     response.sendError(err, res, 400);
  //   });


  // const url = 'http://localhost:8083/0a8d368e-7708-4c1c-b705-d6d9437bb20c/mdeploy/v1/images';
  // const serviceType = '0a8d368e-7708-4c1c-b705-d6d9437bb20c-mdeploy-v1';

  // rpAuth(serviceType, {
  //   url,
  //   method: 'GET',
  //   token,
  // }, context, true)
  //   .then((result) => response.sendResult(result, 200, res))
  //   .fail((err) => response.sendError(err, res, 400));
};

module.exports = {
  updateClientStatus,
};

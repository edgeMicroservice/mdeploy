/* eslint-disable global-require */
/* eslint-disable max-len */
/* eslint-disable arrow-body-style */
/* eslint-disable no-multiple-empty-lines */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-unused-vars */
const Q = require('q');

const response = require('@mimik/edge-ms-helper/response-helper');

const { getServiceLinkByNodeId } = require('../lib/edgeAuth');
const makeTokenSelector = require('../lib/tokenSelector');
const makeClientProcessor = require('../processors/clientProcessor');

const { rpAuth } = require('../lib/edgeAuth');

const fetchToken = (context) => makeTokenSelector(context)
  .selectUserToken();

const updateClientStatus = (req, res) => {
  const { context, swagger } = req;
  const { jwt, payload } = context.security.token;
  const { status } = swagger.params.newClientStatus;
  const expiresIn = payload.exp - payload.iat;

  const { http } = context;


  // Q.fcall(() => {
  //   const nodeId = '6a6f7fd9e1bac51032637ca955e56ff0f70985e54a42390738b8edcf';
  //   const serviceType = '0a8d368e-7708-4c1c-b705-d6d9437bb20c-mdeploy-v1';

  //   return fetchToken(context)
  //     .then((accessToken) => getServiceLinkByNodeId(nodeId, serviceType, accessToken, context));
  // })
  //   .then((data) => response.sendResult(data || {}, 200, res))
  //   .fail((err) => response.sendError(err || { err: 'erur' }, res, 400));



  makeClientProcessor(context)
    .updateClientStatus(status, jwt, expiresIn)
    .then(() => {
      const responseObj = status === 'active' ? {
        status: 'active',
        inactiveAfter: payload.exp,
      } : {
        status: 'inactive',
      };
      // response.sendResult(responseObj, 200, res);
    })
    .fail((err) => {
      // response.sendError(err, res, 400);
    });


  // const url = 'http://localhost:8083/0a8d368e-7708-4c1c-b705-d6d9437bb20c/mdeploy/v1/images';
  // const serviceType = '0a8d368e-7708-4c1c-b705-d6d9437bb20c-mdeploy-v1';

  // rpAuth('0a8d368e-7708-4c1c-b705-d6d9437bb20c-mdeploy-v1', {
  //   url: 'https://i-0e36008613ad6e8e8-mss-stg.mimik360.com/0a8d368e-7708-4c1c-b705-d6d9437bb20c/mdeploy/v1/images',
  //   method: 'GET',
  //   token: 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBvc3Q6Y29uZmlndXJhdGlvbiIsImlhdCI6MTU4MTUyOTY2OCwiZXhwIjoxODgxNTI5NjY4fQ.XD1-9HCIIBV8GhSL2bhZZ2yFz8Vts6gqIifWBFxyzHQCH507OHg0I1E-UFRqViVumE0ODlR_ikRjRjr-kyFd_--PHfGVkGdpQ5C2osMZAhnC1QgPgq7_0FAyvL1uiwh3G4ef8QZ3izVrzsgYhnl5_x42TbwgW-h7HOaILS_yoyY',
  //   headers: {
  //     'x-mimik-routing': 'eyJub2RlSWQiOiI2YTZmN2ZkOWUxYmFjNTEwMzI2MzdjYTk1NWU1NmZmMGY3MDk4NWU1NGE0MjM5MDczOGI4ZWRjZiIsImxvY2FsTGlua05ldHdvcmtJZCI6ImV5SnVaWFIzYjNKclFXUmtjbVZ6Y3lJNkluZzRNVmh0WlZCRE5ETjVNWEZGZVU5YVMzQndkelJSWkdKNldrSjRkSE5VSWl3aWNIVmliR2xqUVdSa2NtVnpjeUk2SWpJd055NDRNUzR4TGpFME5DSjkifQ==',
  //     'x-mimik-port': 8100,
  //   },
  // }, context, true)
  //   .then((result) => response.sendResult(result, 200, res))
  //   .fail((err) => response.sendError(err, res, 400));
};

module.exports = {
  updateClientStatus,
};

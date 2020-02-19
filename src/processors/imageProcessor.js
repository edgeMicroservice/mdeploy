/* eslint-disable no-unused-vars */
const Q = require('q');
const find = require('lodash/find');

const makeMcmAPIs = require('../lib/mcmAPIs');

const makeImageProcessor = (context) => {
  const getImages = () => makeMcmAPIs(context).getCachedImages();

  const deleteImage = (id) => makeMcmAPIs(context).deleteCachedImage(id);

  return {
    getImages,
    deleteImage,
  };
};

module.exports = makeImageProcessor;

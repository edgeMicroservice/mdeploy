const mcmImageToImageObj = (mcmImage) => {
  const index = mcmImage.name.lastIndexOf('-v');
  const name = mcmImage.name.slice(0, index === -1 ? mcmImage.name.length : index);
  let version = index === -1 ? null : mcmImage.name.slice(index + 2, mcmImage.name.length);
  version = version === '' ? null : version;

  console.log('===> converted mcmImageToImageObj', {
    id: mcmImage.id,
    name,
    version,
    size: mcmImage.size,
  });

  return {
    id: mcmImage.id,
    name,
    version,
    size: mcmImage.size,
  };
};

module.exports = {
  mcmImageToImageObj,
};

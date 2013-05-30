exports.prevent = function (paths) {
  return function (req, res, next) {
    if (paths.indexOf(req.path) > -1) {
      res.setHeader('Cache-Control', 'private, max-age=0, no-cache, no-store');
    }
    next();
  };
};

exports.revalidate = function (paths) {
  return function (req, res, next) {
    if (paths.indexOf(req.path) > -1) {
      res.setHeader('Vary', 'Accept-Encoding, Accept-Language');
      res.setHeader('Cache-Control', 'public, max-age=0');
    }
    next();
  };
};

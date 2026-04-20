const stealthMiddleware = (req, res, next) => {
  if (req.headers['x-stealth-mode'] === 'true') {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
};
module.exports = stealthMiddleware;

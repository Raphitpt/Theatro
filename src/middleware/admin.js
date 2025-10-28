const authenticateToken = require('./auth');

const isAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (!req.user || req.user.role !== 'Administrator') {
      return res.status(403).json({
        message: 'Accés refusé. Droits administrateur requis.'
      });
    }
    next();
  });
};

module.exports = isAdmin;
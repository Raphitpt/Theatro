const authenticateToken = require('./auth');

const isAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (!req.user || (req.user.role !== 'Administrator' && req.user.role !== 'Manager')) {
      return res.status(403).json({
        message: 'Accès refusé. Droits administrateur ou manager requis.'
      });
    }
    next();
  });
};

module.exports = isAdmin;
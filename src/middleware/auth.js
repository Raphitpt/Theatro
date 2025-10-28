const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Unauthorized. No token provided.'
    });
  }
  try {
    req.user = jwt.verify(token, process.env.RANDOM_PRIVATE_KEY);

    next();
  } catch (error) {
    return res.status(403).json({
      message: 'Forbidden - Invalid or expired token',
    });
  }
};

module.exports = authenticateToken;
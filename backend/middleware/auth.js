const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'supersecretjwtkey12345');
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

const roleAuth = (allowedRoles = []) => {
  return (req, res, next) => {
    auth(req, res, () => {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: `Access denied: Role '${req.user.role}' is not authorized for this action` 
        });
      }

      next();
    });
  };
};

const adminAuth = roleAuth(['admin']);
const ownerAuth = roleAuth(['admin', 'owner']);
const chefAuth = roleAuth(['admin', 'chef']);
const waiterAuth = roleAuth(['admin', 'waiter']);

module.exports = { auth, roleAuth, adminAuth, ownerAuth, chefAuth, waiterAuth };

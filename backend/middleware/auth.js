const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
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

const normalizeRole = (role) => {
  if (role === 'chef') return 'kitchen';
  if (role === 'receptionist') return 'reception';
  if (role === 'owner') return 'admin';
  return role;
};

const roleAuth = (allowedRoles = []) => {
  return (req, res, next) => {
    auth(req, res, () => {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const userRole = normalizeRole(req.user.role);
      const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));

      // Admin has universal superuser access
      if (userRole === 'admin') {
        return next();
      }

      if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(userRole)) {
        return res.status(403).json({ 
          message: `Access denied: Role '${req.user.role}' is not authorized for this action` 
        });
      }

      next();
    });
  };
};

const adminAuth = roleAuth(['admin']);
const kitchenAuth = roleAuth(['kitchen', 'admin']);
const waiterAuth = roleAuth(['waiter', 'admin']);
const receptionAuth = roleAuth(['reception', 'admin']);

module.exports = { 
  auth, 
  roleAuth, 
  adminAuth, 
  kitchenAuth, 
  waiterAuth, 
  receptionAuth, 
  normalizeRole 
};

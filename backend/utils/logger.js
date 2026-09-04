const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity to DB and broadcast over socket.io
 */
const logActivity = async ({ req, user, actionType, targetType, targetId, details, io }) => {
  try {
    const actor = user || req?.user;
    if (!actor) return;

    const logEntry = new ActivityLog({
      user: actor._id || actor.id,
      userName: actor.name || 'System',
      userRole: actor.role || 'system',
      actionType,
      targetType,
      targetId: targetId ? targetId.toString() : '',
      details: details || '',
      timestamp: new Date()
    });

    await logEntry.save();

    const socketInstance = io || (req && req.app ? req.app.get('io') : null);
    if (socketInstance) {
      socketInstance.emit('activity:new', logEntry);
    }

    return logEntry;
  } catch (error) {
    console.error('Error recording activity log:', error.message);
  }
};

module.exports = { logActivity };

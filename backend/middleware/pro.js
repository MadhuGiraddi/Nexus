const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Authentication required' });
    
    const user = await User.findById(req.userId);
    if (!user || !user.isSubscribed) {
      return res.status(403).json({ error: 'Premium subscription required to access the CA module.' });
    }
    
    req.user = user; // Attach full user for downstream use
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while verifying subscription' });
  }
};

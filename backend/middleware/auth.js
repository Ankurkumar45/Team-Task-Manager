const jwt = require('jsonwebtoken');
const db = require('../db/index.js');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-key-change-in-prod';

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.users.findOne({ _id: decoded.userId });
        if (!user) return res.status(401).json({ error: 'User not found' });

        req.user = { id: user._id, email: user.email, name: user.name, role: user.role };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const requireProjectAccess = (requiredRole = null) => async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.body.projectId;
        if (!projectId) return res.status(400).json({ error: 'Project ID required' });

        // Global admin bypass
        if (req.user.role === 'admin') {
            req.projectRole = 'admin';
            return next();
        }

        const membership = await db.memberships.findOne({ projectId, userId: req.user.id });
        if (!membership) return res.status(403).json({ error: 'Access denied' });

        if (requiredRole === 'admin' && membership.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.projectRole = membership.role;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { authenticate, requireProjectAccess, JWT_SECRET };
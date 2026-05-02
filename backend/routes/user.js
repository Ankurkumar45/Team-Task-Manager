const express = require('express');
const db = require('../db/index.js');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/users - list all users (for member search)
router.get('/', async (req, res) => {
    try {
        const users = await db.users.find({});
        res.json(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/search?email=...
router.get('/search', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.json([]);
        const users = await db.users.find({ email: new RegExp(email, 'i') });
        res.json(users.map(u => ({ id: u._id, name: u.name, email: u.email })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
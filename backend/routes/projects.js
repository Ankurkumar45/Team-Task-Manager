const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/index.js');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/projects - list all projects user is member of
router.get('/', async (req, res) => {
    try {
        let projects;
        if (req.user.role === 'admin') {
            projects = await db.projects.find({}, { createdAt: -1 });
        } else {
            const memberships = await db.memberships.find({ userId: req.user.id });
            const projectIds = memberships.map(m => m.projectId);
            projects = await db.projects.find({ _id: { $in: projectIds } });
        }

        // Attach stats & role to each project
        const enriched = await Promise.all(projects.map(async (p) => {
            const totalTasks = await db.tasks.count({ projectId: p._id });
            const doneTasks = await db.tasks.count({ projectId: p._id, status: 'done' });
            const overdueTasks = await db.tasks.count({
                projectId: p._id,
                dueDate: { $lt: new Date().toISOString() },
                status: { $nin: ['done'] }
            });
            const memberCount = await db.memberships.count({ projectId: p._id });
            const membership = await db.memberships.findOne({ projectId: p._id, userId: req.user.id });

            return {
                ...p,
                totalTasks, doneTasks, overdueTasks, memberCount,
                userRole: req.user.role === 'admin' ? 'admin' : (membership?.role || 'member')
            };
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects - create project
router.post('/', [
    body('name').trim().notEmpty().withMessage('Project name required'),
    body('description').optional().trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { name, description, color } = req.body;
        const project = await db.projects.insert({
            name, description: description || '',
            color: color || '#6366f1',
            ownerId: req.user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Add creator as admin member
        await db.memberships.insert({
            projectId: project._id,
            userId: req.user.id,
            role: 'admin',
            joinedAt: new Date().toISOString()
        });

        res.status(201).json({ ...project, userRole: 'admin', totalTasks: 0, doneTasks: 0, memberCount: 1 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/projects/:projectId
router.get('/:projectId', requireProjectAccess(), async (req, res) => {
    try {
        const project = await db.projects.findOne({ _id: req.params.projectId });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const memberships = await db.memberships.find({ projectId: project._id });
        const members = await Promise.all(memberships.map(async (m) => {
            const user = await db.users.findOne({ _id: m.userId });
            return { id: m.userId, name: user?.name, email: user?.email, role: m.role, joinedAt: m.joinedAt };
        }));

        res.json({ ...project, members, userRole: req.projectRole });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/projects/:projectId
router.put('/:projectId', requireProjectAccess('admin'), [
    body('name').optional().trim().notEmpty(),
], async (req, res) => {
    try {
        const { name, description, color } = req.body;
        const update = { $set: { updatedAt: new Date().toISOString() } };
        if (name) update.$set.name = name;
        if (description !== undefined) update.$set.description = description;
        if (color) update.$set.color = color;

        await db.projects.update({ _id: req.params.projectId }, update);
        const updated = await db.projects.findOne({ _id: req.params.projectId });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/projects/:projectId
router.delete('/:projectId', requireProjectAccess('admin'), async (req, res) => {
    try {
        await db.projects.remove({ _id: req.params.projectId });
        await db.tasks.remove({ projectId: req.params.projectId }, { multi: true });
        await db.memberships.remove({ projectId: req.params.projectId }, { multi: true });
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects/:projectId/members - add member
router.post('/:projectId/members', requireProjectAccess('admin'), [
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['admin', 'member']),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { email, role } = req.body;
        const user = await db.users.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const existing = await db.memberships.findOne({ projectId: req.params.projectId, userId: user._id });
        if (existing) return res.status(409).json({ error: 'User already a member' });

        await db.memberships.insert({
            projectId: req.params.projectId,
            userId: user._id,
            role,
            joinedAt: new Date().toISOString()
        });

        res.status(201).json({ id: user._id, name: user.name, email: user.email, role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/projects/:projectId/members/:userId
router.delete('/:projectId/members/:userId', requireProjectAccess('admin'), async (req, res) => {
    try {
        await db.memberships.remove({ projectId: req.params.projectId, userId: req.params.userId });
        res.json({ message: 'Member removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/projects/:projectId/members/:userId/role
router.put('/:projectId/members/:userId/role', requireProjectAccess('admin'), async (req, res) => {
    try {
        const { role } = req.body;
        if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
        await db.memberships.update(
            { projectId: req.params.projectId, userId: req.params.userId },
            { $set: { role } }
        );
        res.json({ message: 'Role updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
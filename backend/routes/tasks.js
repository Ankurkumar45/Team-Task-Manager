const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/index.js');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/tasks/dashboard - user's dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        let allTasks;
        const now = new Date().toISOString();

        if (req.user.role === 'admin') {
            allTasks = await db.tasks.find({});
        } else {
            const memberships = await db.memberships.find({ userId: req.user.id });
            const projectIds = memberships.map(m => m.projectId);
            allTasks = await db.tasks.find({ projectId: { $in: projectIds } });
        }

        const myTasks = allTasks.filter(t => t.assigneeId === req.user.id);
        const overdue = allTasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'done');
        const myOverdue = myTasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'done');

        const byStatus = {
            todo: allTasks.filter(t => t.status === 'todo').length,
            in_progress: allTasks.filter(t => t.status === 'in_progress').length,
            review: allTasks.filter(t => t.status === 'review').length,
            done: allTasks.filter(t => t.status === 'done').length,
        };

        // Recent tasks (last 5 updated)
        const recentTasks = allTasks
            .sort((a, b) => (b.updatedAt || b.createdAt) > (a.updatedAt || a.createdAt) ? 1 : -1)
            .slice(0, 5);

        // Enrich with project names
        const enrichTask = async (t) => {
            const project = await db.projects.findOne({ _id: t.projectId });
            const assignee = t.assigneeId ? await db.users.findOne({ _id: t.assigneeId }) : null;
            return { ...t, projectName: project?.name, assigneeName: assignee?.name };
        };

        const enrichedRecent = await Promise.all(recentTasks.map(enrichTask));
        const enrichedOverdue = await Promise.all(overdue.slice(0, 5).map(enrichTask));

        res.json({
            stats: {
                total: allTasks.length,
                myTasks: myTasks.length,
                overdue: overdue.length,
                myOverdue: myOverdue.length,
                byStatus
            },
            recentTasks: enrichedRecent,
            overdueTasks: enrichedOverdue
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', requireProjectAccess(), async (req, res) => {
    try {
        const { status, assigneeId, priority } = req.query;
        const query = { projectId: req.params.projectId };
        if (status) query.status = status;
        if (assigneeId) query.assigneeId = assigneeId;
        if (priority) query.priority = priority;

        const tasks = await db.tasks.find(query, { createdAt: -1 });

        const enriched = await Promise.all(tasks.map(async (t) => {
            const assignee = t.assigneeId ? await db.users.findOne({ _id: t.assigneeId }) : null;
            const creator = await db.users.findOne({ _id: t.creatorId });
            return { ...t, assigneeName: assignee?.name, creatorName: creator?.name };
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tasks - create task
router.post('/', [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('projectId').notEmpty().withMessage('Project ID required'),
    body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
], requireProjectAccess(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;

        // Validate assignee is project member
        if (assigneeId) {
            const membership = await db.memberships.findOne({ projectId, userId: assigneeId });
            if (!membership && req.user.role !== 'admin') {
                return res.status(400).json({ error: 'Assignee must be a project member' });
            }
        }

        const task = await db.tasks.insert({
            title, description: description || '',
            projectId,
            assigneeId: assigneeId || null,
            creatorId: req.user.id,
            status: status || 'todo',
            priority: priority || 'medium',
            dueDate: dueDate || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        const assignee = task.assigneeId ? await db.users.findOne({ _id: task.assigneeId }) : null;
        res.status(201).json({ ...task, assigneeName: assignee?.name, creatorName: req.user.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/tasks/:taskId
router.put('/:taskId', async (req, res) => {
    try {
        const task = await db.tasks.findOne({ _id: req.params.taskId });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        // Check project access
        const membership = await db.memberships.findOne({ projectId: task.projectId, userId: req.user.id });
        if (!membership && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { title, description, assigneeId, status, priority, dueDate } = req.body;
        const $set = { updatedAt: new Date().toISOString() };
        if (title !== undefined) $set.title = title;
        if (description !== undefined) $set.description = description;
        if (assigneeId !== undefined) $set.assigneeId = assigneeId;
        if (status !== undefined) $set.status = status;
        if (priority !== undefined) $set.priority = priority;
        if (dueDate !== undefined) $set.dueDate = dueDate;

        await db.tasks.update({ _id: req.params.taskId }, { $set });
        const updated = await db.tasks.findOne({ _id: req.params.taskId });
        const assignee = updated.assigneeId ? await db.users.findOne({ _id: updated.assigneeId }) : null;
        res.json({ ...updated, assigneeName: assignee?.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/tasks/:taskId
router.delete('/:taskId', async (req, res) => {
    try {
        const task = await db.tasks.findOne({ _id: req.params.taskId });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const membership = await db.memberships.findOne({ projectId: task.projectId, userId: req.user.id });
        if (!membership && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Only task creator, project admin, or global admin can delete
        if (task.creatorId !== req.user.id && membership?.role !== 'admin' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only task creator or admin can delete' });
        }

        await db.tasks.remove({ _id: req.params.taskId });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;    
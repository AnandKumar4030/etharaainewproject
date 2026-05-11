const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const projectRole = require('../middleware/projectRole');

// ─── GET /api/tasks/my ────────────────────────────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
    });
    res.json(
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        projectId: t.projectId,
        projectName: t.project?.name || null,
        createdByName: t.createdBy?.name || null,
      }))
    );
  } catch (err) {
    console.error('/tasks/my:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/tasks/project/:projectId ──────────────────────────────────────
router.post(
  '/project/:projectId',
  auth,
  projectRole('admin'),
  [body('title').trim().notEmpty().withMessage('Task title is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    try {
      const projectId = parseInt(req.params.projectId);
      const { title, description, assigneeId, status, priority, dueDate } = req.body;

      const validStatus = ['todo', 'in_progress', 'done'].includes(status) ? status : 'todo';
      const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';

      const task = await prisma.task.create({
        data: {
          title,
          description: description || '',
          projectId,
          assigneeId: assigneeId ? parseInt(assigneeId) : null,
          createdById: req.user.id,
          status: validStatus,
          priority: validPriority,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: {
          assignee: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        projectId: task.projectId,
        assigneeId: task.assigneeId,
        assigneeName: task.assignee?.name || null,
        createdById: task.createdById,
        createdByName: task.createdBy?.name || null,
      });
    } catch (err) {
      console.error('/tasks POST:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Determine project role
    let pRole = null;
    if (req.user.role === 'superadmin') {
      pRole = 'admin';
    } else {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: task.projectId, userId: req.user.id },
        },
      });
      if (!member)
        return res.status(403).json({ message: 'Not a member of this project' });
      pRole = member.role;
    }

    const { title, description, assigneeId, status, priority, dueDate } = req.body;
    let updateData;

    if (pRole === 'admin') {
      updateData = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        assigneeId: assigneeId !== undefined ? (assigneeId ? parseInt(assigneeId) : null) : task.assigneeId,
        ...(status && { status }),
        ...(priority && { priority }),
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
      };
    } else {
      if (!status) return res.status(400).json({ message: 'Members can only update task status' });
      updateData = { status };
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.json({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      priority: updated.priority,
      dueDate: updated.dueDate,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      projectId: updated.projectId,
      assigneeId: updated.assigneeId,
      assigneeName: updated.assignee?.name || null,
      createdById: updated.createdById,
      createdByName: updated.createdBy?.name || null,
    });
  } catch (err) {
    console.error('/tasks/:id PUT:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'superadmin') {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: task.projectId, userId: req.user.id },
        },
      });
      if (!member || member.role !== 'admin')
        return res.status(403).json({ message: 'Project admin access required' });
    }

    await prisma.task.delete({ where: { id: taskId } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const projectRole = require('../middleware/projectRole');

// ─── GET /api/projects ────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'superadmin') {
      projects = await prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { name: true } },
          _count: { select: { members: true, tasks: true } },
        },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          members: { some: { userId: req.user.id } },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { name: true } },
          members: {
            where: { userId: req.user.id },
            select: { role: true },
          },
          _count: { select: { members: true, tasks: true } },
        },
      });
    }

    const formatted = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      ownerId: p.ownerId,
      ownerName: p.owner?.name || null,
      createdAt: p.createdAt,
      memberCount: p._count.members,
      taskCount: p._count.tasks,
      myRole:
        req.user.role === 'superadmin'
          ? 'admin'
          : p.members?.[0]?.role || 'member',
    }));

    res.json(formatted);
  } catch (err) {
    console.error('/projects GET:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/projects ───────────────────────────────────────────────────────
router.post(
  '/',
  auth,
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    try {
      const { name, description } = req.body;

      const project = await prisma.project.create({
        data: {
          name,
          description: description || '',
          ownerId: req.user.id,
          members: {
            create: { userId: req.user.id, role: 'admin' },
          },
        },
        include: {
          owner: { select: { name: true } },
          _count: { select: { members: true, tasks: true } },
        },
      });

      res.status(201).json({
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        ownerName: project.owner?.name,
        createdAt: project.createdAt,
        memberCount: project._count.members,
        taskCount: project._count.tasks,
        myRole: 'admin',
      });
    } catch (err) {
      console.error('/projects POST:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── GET /api/projects/:id ────────────────────────────────────────────────────
router.get('/:id', auth, projectRole('member'), async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.json({
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      ownerName: project.owner?.name,
      createdAt: project.createdAt,
      myRole: req.projectRole,
      members: project.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        assigneeId: t.assigneeId,
        assigneeName: t.assignee?.name || null,
        createdById: t.createdById,
        createdByName: t.createdBy?.name || null,
      })),
    });
  } catch (err) {
    console.error('/projects/:id GET:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUT /api/projects/:id ────────────────────────────────────────────────────
router.put(
  '/:id',
  auth,
  projectRole('admin'),
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    try {
      const { name, description } = req.body;
      const project = await prisma.project.update({
        where: { id: parseInt(req.params.id) },
        data: { name, description: description || '' },
      });
      res.json(project);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────
router.delete('/:id', auth, projectRole('admin'), async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/projects/:id/members ────────────────────────────────────────────
router.get('/:id/members', auth, projectRole('member'), async (req, res) => {
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId: parseInt(req.params.id) },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(
      members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/projects/:id/members ──────────────────────────────────────────
router.post(
  '/:id/members',
  auth,
  projectRole('admin'),
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    try {
      const projectId = parseInt(req.params.id);
      const { email, role } = req.body;
      const memberRole = ['admin', 'member'].includes(role) ? role : 'member';

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
      });
      if (!user) return res.status(404).json({ message: 'No user found with that email' });

      const existing = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: user.id } },
      });
      if (existing) return res.status(400).json({ message: 'User is already a member' });

      await prisma.projectMember.create({
        data: { projectId, userId: user.id, role: memberRole },
      });

      res.status(201).json({ ...user, role: memberRole });
    } catch (err) {
      console.error('/members POST:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── DELETE /api/projects/:id/members/:userId ─────────────────────────────────
router.delete('/:id/members/:userId', auth, projectRole('admin'), async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    // Prevent removing the sole admin
    if (userId === req.user.id) {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: 'admin' },
      });
      if (adminCount <= 1)
        return res.status(400).json({ message: 'Cannot remove the only admin from the project' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

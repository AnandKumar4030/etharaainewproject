const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// Superadmin-only guard
function superadminOnly(req, res, next) {
  if (req.user.role !== 'superadmin')
    return res.status(403).json({ message: 'Superadmin access required' });
  next();
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', auth, superadminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        _count: { select: { projectMembers: true, assignedTasks: true } },
      },
    });
    res.json(
      users.map((u) => ({
        id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt,
        projectCount: u._count.projectMembers,
        taskCount: u._count.assignedTasks,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUT /api/admin/users/:id/role ────────────────────────────────────────────
router.put(
  '/users/:id/role',
  auth,
  superadminOnly,
  [body('role').isIn(['superadmin', 'member']).withMessage('Role must be superadmin or member')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    try {
      const userId = parseInt(req.params.id);
      if (userId === req.user.id)
        return res.status(400).json({ message: 'Cannot change your own role' });

      const user = await prisma.user.update({
        where: { id: userId },
        data: { role: req.body.role },
        select: { id: true, name: true, email: true, role: true },
      });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
router.delete('/users/:id', auth, superadminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id)
      return res.status(400).json({ message: 'Cannot delete your own account' });

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', auth, superadminOnly, async (req, res) => {
  try {
    const [userCount, projectCount, taskCount, tasksByStatus] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.groupBy({ by: ['status'], _count: { id: true } }),
    ]);
    const statusMap = Object.fromEntries(tasksByStatus.map((s) => [s.status, s._count.id]));
    res.json({
      userCount, projectCount, taskCount,
      tasksByStatus: {
        todo: statusMap.todo || 0,
        in_progress: statusMap.in_progress || 0,
        done: statusMap.done || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

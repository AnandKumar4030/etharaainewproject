const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// ─── GET /api/dashboard ───────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const isSuperAdmin = req.user.role === 'superadmin';
    const now = new Date();

    let stats, recentTasks, recentProjects;

    if (isSuperAdmin) {
      const [totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, totalProjects, totalUsers] =
        await Promise.all([
          prisma.task.count(),
          prisma.task.count({ where: { status: 'todo' } }),
          prisma.task.count({ where: { status: 'in_progress' } }),
          prisma.task.count({ where: { status: 'done' } }),
          prisma.task.count({ where: { dueDate: { lt: now }, status: { not: 'done' } } }),
          prisma.project.count(),
          prisma.user.count(),
        ]);

      stats = { totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, totalProjects, totalUsers };

      const [rt, rp] = await Promise.all([
        prisma.task.findMany({
          take: 8,
          orderBy: { updatedAt: 'desc' },
          include: {
            project: { select: { name: true } },
            assignee: { select: { name: true } },
          },
        }),
        prisma.project.findMany({
          take: 4,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: { select: { name: true } },
            _count: { select: { tasks: true } },
          },
        }),
      ]);

      recentTasks = rt.map((t) => ({
        id: t.id, title: t.title, status: t.status, priority: t.priority,
        dueDate: t.dueDate, updatedAt: t.updatedAt,
        projectName: t.project?.name, assigneeName: t.assignee?.name,
      }));
      recentProjects = rp.map((p) => ({
        id: p.id, name: p.name, description: p.description,
        ownerName: p.owner?.name, taskCount: p._count.tasks,
      }));
    } else {
      const memberProjectIds = await prisma.projectMember.findMany({
        where: { userId: uid },
        select: { projectId: true },
      });
      const projectIds = memberProjectIds.map((m) => m.projectId);

      const [totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, myTasks] =
        await Promise.all([
          prisma.task.count({ where: { projectId: { in: projectIds } } }),
          prisma.task.count({ where: { projectId: { in: projectIds }, status: 'todo' } }),
          prisma.task.count({ where: { projectId: { in: projectIds }, status: 'in_progress' } }),
          prisma.task.count({ where: { projectId: { in: projectIds }, status: 'done' } }),
          prisma.task.count({
            where: { projectId: { in: projectIds }, dueDate: { lt: now }, status: { not: 'done' } },
          }),
          prisma.task.count({ where: { assigneeId: uid } }),
        ]);

      stats = {
        totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks,
        totalProjects: projectIds.length, myTasks,
      };

      const [rt, rp] = await Promise.all([
        prisma.task.findMany({
          where: { projectId: { in: projectIds } },
          take: 8,
          orderBy: { updatedAt: 'desc' },
          include: {
            project: { select: { name: true } },
            assignee: { select: { name: true } },
          },
        }),
        prisma.project.findMany({
          where: { id: { in: projectIds } },
          take: 4,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: { select: { name: true } },
            members: { where: { userId: uid }, select: { role: true } },
            _count: { select: { tasks: true } },
          },
        }),
      ]);

      recentTasks = rt.map((t) => ({
        id: t.id, title: t.title, status: t.status, priority: t.priority,
        dueDate: t.dueDate, updatedAt: t.updatedAt,
        projectName: t.project?.name, assigneeName: t.assignee?.name,
      }));
      recentProjects = rp.map((p) => ({
        id: p.id, name: p.name, description: p.description,
        ownerName: p.owner?.name, taskCount: p._count.tasks,
        myRole: p.members?.[0]?.role || 'member',
      }));
    }

    res.json({ stats, recentTasks, recentProjects });
  } catch (err) {
    console.error('/dashboard:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

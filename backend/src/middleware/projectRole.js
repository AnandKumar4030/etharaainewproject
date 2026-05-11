const prisma = require('../lib/prisma');

/**
 * Middleware factory: ensures the authenticated user has at least `minRole` on the project.
 * Roles hierarchy: admin > member
 * superadmin users always pass.
 * Attaches `req.projectRole` for downstream use.
 * @param {'admin'|'member'} minRole
 */
module.exports = function projectRole(minRole = 'member') {
  return async (req, res, next) => {
    try {
      // Superadmin always has access
      if (req.user.role === 'superadmin') {
        req.projectRole = 'admin';
        return next();
      }

      const projectId = parseInt(req.params.id || req.params.projectId);
      if (!projectId) return res.status(400).json({ message: 'Invalid project ID' });

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: req.user.id },
        },
      });

      if (!member) return res.status(403).json({ message: 'Access denied: not a project member' });

      if (minRole === 'admin' && member.role !== 'admin')
        return res.status(403).json({ message: 'Access denied: project admin required' });

      req.projectRole = member.role;
      next();
    } catch (err) {
      console.error('projectRole middleware error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };
};

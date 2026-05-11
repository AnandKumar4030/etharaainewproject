const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    try {
      const { name, email, password } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing)
        return res.status(400).json({ message: 'Email already in use' });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });

      const token = signToken(user);
      res.status(201).json({ token, user });
    } catch (err) {
      console.error('/signup error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      const token = signToken(user);
      const { passwordHash, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (err) {
      console.error('/login error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put(
  '/profile',
  auth,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array()[0].msg });

    try {
      const { name } = req.body;
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

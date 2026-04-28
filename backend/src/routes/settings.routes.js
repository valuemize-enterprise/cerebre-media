const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { query } = require('../db/db');

const router = express.Router();

// ── PUT /settings/profile ─────────────────────────────────────
router.put(
  '/profile',
  authenticate,
  [
    body('fullName').trim().notEmpty().withMessage('Name required'),
    body('company').trim().optional(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { fullName, company } = req.body;
    const result = await query(
      `UPDATE users
       SET full_name = $1, company = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, full_name, company, role`,
      [fullName, company || 'Cerebre Media Africa', req.user.userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Profile updated', user: result.rows[0] });
  })
);

// ── PUT /settings/password ────────────────────────────────────
router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be 8+ characters'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;

    // Fetch current hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 12);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, req.user.userId]
    );

    res.json({ message: 'Password updated successfully' });
  })
);

// ── GET /settings/profile ─────────────────────────────────────
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await query(
      'SELECT id, email, full_name, company, role, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  })
);

module.exports = router;

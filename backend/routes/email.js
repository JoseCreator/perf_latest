import express from 'express';

const router = express.Router();

// Placeholder for email functionality
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Email functionality placeholder'
  });
});

export default router;
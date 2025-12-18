const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

// after user is created/saved
console.log('Created user -> id:', user._id, 'email:', user.email);

module.exports = router;
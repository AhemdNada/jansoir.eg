const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createAdmin,
    loginAdmin,
    getAdmins,
    updateAdmin,
    deleteAdmin
} = require('../controllers/adminController');

router.post('/login', loginAdmin);
router.post('/', protect, admin, createAdmin);
router.get('/', protect, admin, getAdmins);
router.put('/:id', protect, admin, updateAdmin);
router.delete('/:id', protect, admin, deleteAdmin);

module.exports = router;



const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// Routes for members
router.get('/stats', memberController.getStats);
router.get('/', memberController.getAllMembers);
router.get('/:id', memberController.getMemberById);
router.post('/', memberController.createMember);
router.put('/:id', memberController.updateMember);
router.post('/:id/restore', memberController.restoreMember);
router.delete('/:id/permanent', memberController.permanentlyDeleteMember);
router.delete('/:id', memberController.deleteMember);

module.exports = router;

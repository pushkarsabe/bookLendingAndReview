const express = require('express');
const router = express.Router();
const lendingController = require('../controller/lending');
const { authMiddleware, isAdmin } = require('../auth/auth');

// POST /api/lendings/borrow - Borrow a book
// router.post('/borrow', authMiddleware, lendingController.borrowBook);

// GET /api/lendings - Get all of the user's borrowed books
router.get('/', authMiddleware, lendingController.getMyBorrowedBooks);

// GET /api/lendings/overdue - Get all of the user's overdue books
router.get('/overdue', authMiddleware, lendingController.getOverdueBooks);

// GET /api/lendings/:lendingId - Get details of a specific borrowed book
router.get('/:lendingId', authMiddleware, lendingController.getLendingDetails);

// PUT /api/lendings/extend/:lendingId - Request a 7-day extension
router.put('/extend/:lendingId', authMiddleware, lendingController.requestExtension);

// A user requests to return a specific book they have borrowed
router.put('/return-request/:lendingId', authMiddleware, lendingController.requestReturn);

// An admin gets a list of all pending return requests
router.get('/admin/pending-returns', [authMiddleware, isAdmin], lendingController.getPendingReturns);
// An admin approves or rejects a specific return request
router.put('/admin/process-return/:lendingId', [authMiddleware, isAdmin], lendingController.processReturn);


module.exports = router;
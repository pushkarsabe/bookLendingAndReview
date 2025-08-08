const express = require('express');
const router = express.Router();

const { authMiddleware, isAdmin } = require('../auth/auth.js');
const bookController = require('../controller/book');
const reviewController = require('../controller/review');

// --- User Routes ---
// GET all books
router.get('/', authMiddleware, bookController.getAllBooks);
// GET a single book by its ID  
router.get('/:bookId', authMiddleware, bookController.getBookById);

// --- Review Routes ---
// GET /api/books/:bookId/reviews
// This route will fetch all reviews for a specific book.
router.get('/:bookId/reviews', authMiddleware, reviewController.getBookReviews);
// POST /api/books/:bookId/review
// This route will add or update a review for a specific book by the logged-in user.
router.post('/:bookId/review', authMiddleware, reviewController.addOrUpdateReview);

// --- NEW ADMIN ROUTES ---
// POST /api/books - Create a new book
router.post('/', [authMiddleware, isAdmin], bookController.createBook);

// DELETE /api/books/:bookId - Delete a book
router.delete('/:bookId', [authMiddleware, isAdmin], bookController.deleteBook);


module.exports = router;
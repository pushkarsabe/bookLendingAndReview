const Lending = require('../model/Lending');
const Book = require('../model/Book');
const User = require('../model/User');
const sequelize = require('../util/database');
const { sendBookReturnEmail, sendOverdueReminderEmail } = require('../config/emailService');
const { Op } = require('sequelize');

exports.borrowBook = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { book_id } = req.body;
        const user_id = req.user.id;
        console.log(`inside borrowBook = User ID: ${user_id}, Book ID: ${book_id}`);

        const book = await Book.findByPk(book_id, { transaction: t });

        // Check if book exists and is available
        if (!book || book.status !== 'available') {
            await t.rollback();
            return res.status(400).json({ message: 'Book is not available for borrowing.' });
        }

        // Update book status to 'borrowed'
        await book.update({ status: 'borrowed' }, { transaction: t });

        const borrow_date = new Date();
        const due_date = new Date();
        due_date.setDate(borrow_date.getDate() + 14); // Set due date 14 days from now

        // Create new lending record
        const newLending = await Lending.create({
            user_id,
            book_id,
            borrow_date,
            due_date,
        }, { transaction: t });

        await t.commit(); // Commit the transaction
        res.status(201).json({ message: 'Book borrowed successfully!', lendingDetails: newLending });

    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Server error during borrowing process', error: error.message });
    }
};

// GET a user's currently borrowed books
exports.getMyBorrowedBooks = async (req, res) => {
    try {
        const user_id = req.user.id;
        console.log(`Fetching borrowed books for User ID: ${user_id}`);

        const lendings = await Lending.findAll({
            where: {
                user_id: user_id,
                returned_date: null
            },
            include: [{
                model: Book,
                attributes: ['title', 'author', 'genre']
            }]
        });
        console.log(`Found ${lendings.length} borrowed books for User ID: ${user_id}`);

        res.status(200).json(lendings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching borrowed books', error: error.message });
    }
};


exports.getLendingDetails = async (req, res) => {
    try {
        // Use 'lendingId' to match the router parameter
        const { lendingId } = req.params;
        console.log(`Fetching lending details for Lending ID: ${lendingId}`);

        const lending = await Lending.findByPk(lendingId, {
            include: [{
                model: Book,
                // Request all necessary attributes for the details page
                attributes: ['book_id', 'title', 'author', 'genre', 'status']
            }]
        });

        console.log('Found lending record:', lending);

        if (!lending) {
            return res.status(204).json({ message: 'Lending record not found.' });
        }

        // Security check: Make sure the logged-in user is the one who borrowed the book
        if (lending.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        res.status(200).json(lending);

    } catch (error) {
        console.error('Error in getLendingDetails:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET a user's overdue books
exports.getOverdueBooks = async (req, res) => {
    try {
        const user_id = req.user.id;
        console.log(`getOverdueBooks Fetching overdue books for User ID: ${user_id}`);

        const lendings = await Lending.findAll({
            where: {
                user_id: user_id,
                returned_date: null,
                due_date: {
                    [Op.lt]: new Date() // Check if the due date is in the past
                }
            },
            include: [{
                model: Book,
                attributes: ['title', 'author', 'genre']
            }]
        });
        console.log("found overdue books:", lendings);

        if (!lendings) {
            return res.status(404).json({ message: 'No overdue books found.' });
        }

        res.status(200).json(lendings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching overdue books', error: error.message });
    }
};

exports.requestExtension = async (req, res) => {
    try {
        const { lendingId } = req.params;
        console.log(` requestExtension = [Extension] Received request for Lending ID: ${lendingId}`);

        // Step 1: Find the lending record
        const lending = await Lending.findByPk(lendingId);

        // Step 2: Handle "Not Found" case
        if (!lending) {
            console.log(`[Extension] Lending record not found for ID: ${lendingId}`);
            return res.status(404).json({ message: 'Lending record not found.' });
        }

        // Step 3: Handle "Access Denied" case (Security check)
        if (lending.user_id !== req.user.id) {
            console.warn(`[Extension] SECURITY: User ${req.user.id} attempted to access lending record ${lendingId} owned by user ${lending.user_id}.`);
            return res.status(403).json({ message: 'Access denied.' });
        }

        // Step 4: Check if the book has already been returned
        if (lending.returned_date) {
            return res.status(400).json({ message: 'Cannot extend a book that has already been returned.' });
        }

        // Step 5: Validate the due_date before using it
        if (!lending.due_date || !(new Date(lending.due_date) instanceof Date)) {
            console.error(`[Extension] Invalid due_date found for lending record ${lendingId}:`, lending.due_date);
            return res.status(500).json({ message: 'Cannot process extension due to an invalid due date in the record.' });
        }

        // Step 6: Calculate the new due date
        const currentDueDate = new Date(lending.due_date);
        currentDueDate.setDate(currentDueDate.getDate() + 7); // Add 7 days

        console.log(`[Extension] Old due date: ${lending.due_date}. New due date: ${currentDueDate}.`);

        // Step 7: Update the record in the database
        await lending.update({ due_date: currentDueDate });

        res.status(200).json({ message: 'Extension successful! New due date confirmed.', lending });

    } catch (error) {
        console.error('[Extension] An unexpected error occurred:', error);
        res.status(500).json({ message: 'Error processing extension request', error: error.message });
    }
};


// User requests to return a book they have borrowed
// This function will change the return status to 'return_pending'
exports.requestReturn = async (req, res) => {
    try {
        const { lendingId } = req.params;
        console.log(`Requesting return for Lending ID: ${lendingId}`);

        const lending = await Lending.findByPk(lendingId);

        if (!lending || lending.user_id !== req.user.id) {
            return res.status(404).json({ message: 'Lending record not found or access denied.' });
        }
        if (lending.return_status !== 'borrowed') {
            return res.status(400).json({ message: 'This book is already pending return or has been returned.' });
        }

        lending.return_status = 'return_pending';
        lending.returned_date = null; // Reset returned date if it was set

        // Save the updated lending record
        await lending.save();
        console.log('lneding after save:', lending.toJSON());

        res.status(200).json({ message: 'Return requested successfully. An admin will review your request.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while requesting return.' });
    }
};

// Admin gets a list of all pending return requests
// This function will return all lendings with status 'return_pending'
exports.getPendingReturns = async (req, res) => {
    console.log('Fetching all pending return requests for admin');

    try {
        const requests = await Lending.findAll({
            where: { return_status: 'return_pending' },
            include: [
                { model: User, attributes: ['name'] },
                { model: Book, attributes: ['title'] }
            ]
        });
        console.log(`Found pending return requests.`, requests);
        if (requests.length === 0) {
            return res.status(201).json({ message: 'No pending return requests found.' });
        }

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching pending returns.' });
    }
};

// Admin approves or rejects a specific return request
// This function will update the return status based on admin action
exports.processReturn = async (req, res) => {
    const { lendingId } = req.params;
    const { action } = req.body;
    console.log(`Processing return for Lending ID: ${lendingId} with action: ${action}`);

    if (!lendingId || !action) {
        return res.status(400).json({ message: 'Lending ID and action are required.' });
    }

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action specified. Use "approve" or "reject".' });
    }

    const t = await sequelize.transaction();

    try {
        const lending = await Lending.findByPk(lendingId, {
            transaction: t,
            include: [
                { model: Book, attributes: ['title'] },
                { model: User, attributes: ['name', 'email'] }
            ]
        });
        console.log('Lending record found:', lending ? lending.toJSON() : 'Not found');

        if (!lending || lending.return_status !== 'return_pending') {
            await t.rollback();
            return res.status(404).json({ message: 'Lending record not found or not pending return.' });
        }

        if (action === 'approve') {
            lending.return_status = 'returned';
            lending.returned_date = new Date();
            await lending.save({ transaction: t });
            console.log('Lending record updated to returned:', lending.toJSON());

            const book = await Book.findByPk(lending.book_id, { transaction: t });
            if (book) {
                book.status = 'available';
                await book.save({ transaction: t });
            }
        } else if (action === 'reject') {
            lending.return_status = 'borrowed';
            await lending.save({ transaction: t });
            console.log('Lending record updated to borrowed:', lending.toJSON());

        } else {
            await t.rollback();
            return res.status(400).json({ message: 'Invalid action specified.' });
        }

        if (lending.User && lending.Book) {
            console.log('User and Book found for email:', lending.User.toJSON(), lending.Book.toJSON());
            await sendBookReturnEmail(lending.User.email, lending.User.name, lending.Book.title, action);
        } else {
            console.error('Eager loading failed. User or Book not available for email.');
        }


        await t.commit();
        res.status(200).json({ message: `Return request has been successfully ${action}d.` });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Server error while processing return.' });
    }
};
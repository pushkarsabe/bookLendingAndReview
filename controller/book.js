const Book = require('../model/Book'); // Use the central export from model/index.js

// Get all books
exports.getAllBooks = async (req, res) => {
    try {
        console.log('Fetching all books...');

        const books = await Book.findAll();
        res.status(200).json({ message: 'Books fetched successfully', books: books });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching books', error: error.message });
    }
};



exports.getBookById = async (req, res) => {
    try {
        const { bookId } = req.params;
        console.log(`Fetching book with ID: ${bookId}`);
        if (!bookId) {
            return res.status(400).json({ message: 'Book ID is required' });
        }

        const book = await Book.findByPk(bookId);
        console.log(`Book found: ${book ? book.title : 'Not Found'}`);

        // If no book is found with that ID, send a 404 error
        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        // If the book is found, send it back with a 200 OK status
        res.status(200).json({
            success: true,
            data: book
        });

    } catch (error) {
        console.error('Error in getBookById:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// --- ADD 'createBook' FUNCTION ---
exports.createBook = async (req, res) => {
    try {
        const { title, author, description, genre } = req.body;
        console.log('Creating a new book:', { title, author, description, genre });

        if (!title || !author) {
            return res.status(400).json({ message: 'Title and author are required.' });
        }
        const newBook = await Book.create({ title, author, description, genre });
        console.log('New book created:', newBook);

        res.status(201).json({ message: 'Book added successfully!', book: newBook });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- ADD 'deleteBook' FUNCTION ---
exports.deleteBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        console.log('Deleting book with ID:', req.params.bookId);
        if (!bookId) {
            return res.status(400).json({ message: 'Book ID is required.' });
        }

        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found.' });
        }
        console.log('Book found:', book);

        await book.destroy();
        res.status(200).json({ message: 'Book deleted successfully.' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
const Review = require('../model/Review');
const User = require('../model/User');
const Book = require('../model/Book');

// Add or update a review for a book
exports.addOrUpdateReview = async (req, res) => {
    const { bookId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    console.log(`User ID: ${userId}, Book ID: ${bookId}, Review comment: ${comment}`);

    try {
        // Use Sequelize's findOrCreate method.
        // It tries to find a review by the user for this book.
        const [review, created] = await Review.findOrCreate({
            where: {
                book_id: bookId,
                user_id: userId
            },
            // These are the values used if a new review is 'created'.
            // If a review is found, it will be updated below.
            defaults: {
                comment: comment
            }
        });
        console.log(`Review ${created ? 'created' : 'found'} for book ID: ${bookId} by user ID: ${userId}`);

        // If the review was found (not created), update its comment.
        if (!created) {
            // If the review was found (not created), update its comment.
            review.comment = comment;
            await review.save();
        }

        res.status(201).json({
            success: true,
            message: `Review ${created ? 'added' : 'updated'} successfully!`,
            data: review
        });

    } catch (error) {
        console.error('Error in addOrUpdateReview:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


//  Get all reviews for a single book
exports.getBookReviews = async (req, res) => {
    const { bookId } = req.params;
    console.log(`Fetching reviews for book ID: ${bookId}`);

    if (!bookId) {
        return res.status(400).json({ message: 'Book ID is required' });
    }

    try {
        const reviews = await Review.findAll({
            where: { book_id: bookId },
            // Include the User model to get the username
            include: [{
                model: User,
                attributes: ['name'] // Only send the user's name
            }],
            order: [['createdAt', 'DESC']] // Show newest reviews first
        });
        console.log(`Reviews: `,reviews);
        console.log(`Found ${reviews.length} reviews for book ID: ${bookId}`);

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });

    } catch (error) {
        console.error('Error in getBookReviews:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
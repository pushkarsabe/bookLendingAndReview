require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const sequelize = require('./util/database');

const userRoutes = require('./routes/user');
const bookRoutes = require('./routes/book');
const lendingRoutes = require('./routes/lending');
const paymentRoutes = require('./routes/payment'); //

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'frontendFiles' directory
app.use(express.static(path.join(__dirname, 'frontendFiles')));

const User = require('./model/User');
const Book = require('./model/Book');
const Lending = require('./model/Lending');
const Review = require('./model/Review');
const Transaction = require('./model/Transaction');

app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/lendings', lendingRoutes);
app.use('/api/payments', paymentRoutes); 

// A simple route to serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontendFiles', 'index.html'));
});


// When a User is deleted, their Lending records are also deleted.
User.hasMany(Lending, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Lending.belongsTo(User, { foreignKey: 'user_id' });

// When a Book is deleted, its Lending records are also deleted.
Book.hasMany(Lending, { foreignKey: 'book_id', onDelete: 'CASCADE' });
Lending.belongsTo(Book, { foreignKey: 'book_id' });

// When a User is deleted, their Review records are also deleted.
User.hasMany(Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'user_id' });

// When a Book is deleted, its Review records are also deleted.
Book.hasMany(Review, { foreignKey: 'book_id', onDelete: 'CASCADE' });
Review.belongsTo(Book, { foreignKey: 'book_id' });

// A Lending record has one Transaction
Lending.hasOne(Transaction, { foreignKey: 'lending_id' });
Transaction.belongsTo(Lending, { foreignKey: 'lending_id' });
      
// Sync database and start server
let connectToDB = async () => {
    try {
        await sequelize.sync();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
        console.log('Database connection established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}
connectToDB();

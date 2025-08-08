const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Book = sequelize.define('Book', {
    book_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    genre: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.ENUM('available', 'borrowed', 'overdue', 'reserved'),
        allowNull: false,
        defaultValue: 'available',
    },
});

module.exports = Book;
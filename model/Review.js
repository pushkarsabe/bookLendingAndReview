const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Review = sequelize.define('Review', {
    review_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    rating: {
        type: DataTypes.INTEGER,
        validate: { min: 1, max: 5 },
        defaultValue : 1,
    },
    comment: {
        type: DataTypes.TEXT,
    },
});

module.exports = Review;
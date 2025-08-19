const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Transaction = sequelize.define('Transaction', {
    transaction_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    stripe_session_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    lending_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Lendings', // This should match the table name for the Lending model
            key: 'lending_id',
        }
    },
    amount: {
        type: DataTypes.INTEGER, 
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING, // e.g., 'completed', 'pending', 'failed'
        allowNull: false,
    },
});

module.exports = Transaction;
// model/Transaction.js
const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Transaction = sequelize.define('Transaction', {
    transaction_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    razorpay_payment_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    razorpay_order_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    razorpay_signature: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lending_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Lendings',
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
        type: DataTypes.STRING,
        allowNull: false,
    },
});

module.exports = Transaction;
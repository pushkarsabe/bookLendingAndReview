const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Lending = sequelize.define('Lending', {
    lending_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    borrow_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: false,   
    },
    returned_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
     return_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'borrowed' // Possible values: 'borrowed', 'return_pending', 'returned'
    },
});

module.exports = Lending;
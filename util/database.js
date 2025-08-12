const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
    // This block will be used by Render
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Necessary for Render's Postgres
            }
        }
    });
}
else {

    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            dialect: 'mysql'
        }
    );
}


module.exports = sequelize;
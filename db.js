require("dotenv").config();
const mysql = require("mysql2");


const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user:process.env.DB_USERNAME,
    database:process.env.DB_DATABASE,
    password:process.env.DB_PASSWORD
});

module.exports = connection;
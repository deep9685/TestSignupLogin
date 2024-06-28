require("dotenv").config();
const mysql = require("mysql2");


// const connection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user:process.env.DB_USERNAME,
//     database:process.env.DB_DATABASE,
//     password:process.env.DB_PASSWORD
// });

// module.exports = connection;

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }).promise();  // Enable promises

  pool.getConnection()

  module.exports = pool;
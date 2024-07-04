require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");


const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8000;

const pool = require('./db');


// Ensure database connection
async function testDbConnection() {
    try {
        await pool.query('SELECT 1');
        console.log('Database connection successful');
    } catch (err) {
        console.error('Database connection error:', err);
    }
}

testDbConnection();


const addUserRoute = require('./routes/addUserRoute');
const loginRoute = require('./routes/loginRoute');

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());


app.set('views', './views');
app.set('view engine', 'ejs');


app.use('/signup', addUserRoute);
app.use('/login', loginRoute);



app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}`);
});

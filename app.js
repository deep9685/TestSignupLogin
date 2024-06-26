require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");


const app = express();
const PORT = process.env.PORT || 8000;

const pool = require('./db');


// const connection = require('./db')

// connection.connect(function(err) {
//     if(err){
//         console.log(err, 'cannot connet');
//         return;
//     }

//     console.log("Database connected");
// });

pool.getConnection((err, connection) => {

    console.log("i am here");
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }

    console.log('Database connected');

    // Release the connection back to the pool
    connection.release();
});


const SignupRoute = require('./routes/SignupRoute');
const loginRoute = require('./routes/loginRoute');

// app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());


app.set('views', './views');
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/signup', (req,res) => {
    res.render('signup.ejs');
});

app.get('/login', (req,res) => {
    res.render('login.ejs');
});

app.use('/signup', SignupRoute);
app.use('/login', loginRoute);



app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}`);
});

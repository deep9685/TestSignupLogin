require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const {checkForAuthenticationCookie} = require("../middleware/authentication")


// const connection = require('../db');
const pool = require('../db');


router.post('/', (req, res) => {
    const {email, password} = req.body;

    //now checking email and password against database
    connection.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if(err) throw err;

        if(result.length > 0)
        {
            const user = result[0];
            
            bcrypt.compare(password, user.password, (bcryptErr, bcryptResult) => {
                
                if(bcryptResult)
                {
                    let token;
                    try {
                        token = jwt.sign(
                            {
                                email: user.email,
                                role: user.role,
                            },
                            process.env.JWT_SECRET,
                            { expiresIn: "1h" }
                        );
                    } catch (error) {
                        return res.status(500).send('Internal server error');
                    }

                    return res.cookie("token", token).send(`Standard login post request: Welcome ${email}`);
            
                }
                else
                {
                    return res.status(401).send('Incorrect password');
                }
            });
        }
        else
        {
            return res.status(404).send('Email not found, please sign up');
            
        }
    });
});


router.get('/data', checkForAuthenticationCookie("token"),async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT email, role FROM users');

        if (rows.length > 0) {
            return res.status(200).json(rows);
        } else {
            return res.status(404).json({ message: 'No data found' });
        }
    } catch (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// setting up multer for file upload
const storage  = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "./upload");
    },

    filename: function(req, file, cb){
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({storage: storage});


router.get('/upload', (req,res) => {
    res.render('fileupload.ejs');
});

router.post('/upload', upload.array('files'), (req, res) => {

    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    const fileDetails = files.map(file => [
        file.originalname,
        file.path,
        file.mimetype
    ]);

    const sql = 'INSERT INTO files (file_name, file_path, file_type) VALUES ?';
    
    connection.query(sql, [fileDetails], (err, result) => {
        if (err) {
            console.error('Database insert error:', err);
            return res.status(500).json({ message: 'File upload failed' });
        }
        res.status(200).json({ message: 'Files uploaded successfully', files: fileDetails });
    });
})

module.exports = router;

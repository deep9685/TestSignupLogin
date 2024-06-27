require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const {checkForAuthenticationCookie} = require("../middleware/authentication")


// const connection = require('../db');
const pool = require('../db');

router.use(express.json()); // Middleware to parse JSON data
router.use(express.urlencoded({ extended: true }));


router.post('/',async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        console.error('Email or password missing');
        return res.status(400).send('Email and password are required');
    }

    try {
        const [result] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (result.length > 0) {
            const user = result[0];

            const bcryptResult = await bcrypt.compare(password, user.password);

            if (bcryptResult) {
                let token;
                try {
                    token = jwt.sign(
                        {
                            email: user.email,
                            role: user.role,
                        },
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                    );
                } catch (error) {
                    console.error('JWT signing error:', error);
                    return res.status(500).send('Internal server error');
                }

                // return res.cookie('token', token).send(`Standard login post request: Welcome ${email}`);
                // return res.status(200).cookie('token', token).json({message: 'Login successful', token, user});
                return res.cookie('token', token, { httpOnly: true }).status(200).json({ message: 'Login successful', token, user });

            } else {
                console.log('Incorrect password');
                return res.status(401).send('Incorrect password');
            }
        } else {
            console.log('Email not found');
            return res.status(404).send('Email not found, please sign up');
        }
    } catch (err) {
        console.error('Database query error:', err);
        return res.status(500).send('Internal server error');
    }
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

// router.post('/upload', upload.array('files'), (req, res) => {

//     const files = req.files;
//     if (!files || files.length === 0) {
//         return res.status(400).json({ message: 'No files were uploaded.' });
//     }

//     const fileDetails = files.map(file => [
//         file.originalname,
//         file.path,
//         file.mimetype
//     ]);

//     const sql = 'INSERT INTO files (file_name, file_path, file_type) VALUES ?';
    
//     connection.query(sql, [fileDetails], (err, result) => {
//         if (err) {
//             console.error('Database insert error:', err);
//             return res.status(500).json({ message: 'File upload failed' });
//         }
//         res.status(200).json({ message: 'Files uploaded successfully', files: fileDetails });
//     });
// })


router.post('/upload', upload.array('files'), async (req, res) => {
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

    try {
        const [result] = await pool.query(sql, [fileDetails]);
        res.status(200).json({ message: 'Files uploaded successfully', files: fileDetails });
    } catch (err) {
        console.error('Database insert error:', err);
        res.status(500).json({ message: 'File upload failed' });
    }
});

module.exports = router;

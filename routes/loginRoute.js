require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const xlsx = require('xlsx');

const {authenticateToken} = require("../middleware/authentication")


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
                            id: user.id,
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
                console.log(user);
                return res.status(200).json({message: 'Login successful', token, user});
                // return res.cookie('token', token, { httpOnly: true }).status(200).json({ message: 'Login successful', token, user });

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

router.get('/data', authenticateToken,async (req, res) => {
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


router.get('/upload', (req,res) => {
    res.render('fileupload.ejs');
});


// Setup Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });


router.post('/upload', authenticateToken, upload.array('files'), async (req, res) => {
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    try {
        // Process each uploaded file
        for (const file of files) {
            if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {
                // Process Excel file
                await processExcelFile(file.buffer, file.originalname, req.user.id); // Assuming req.user.id contains the user ID
            } else {
                return res.status(400).json({ message: 'Unsupported file type' });
            }
        }

        res.status(200).json({ message: 'Files processed successfully' });
    } catch (err) {
        console.error('File processing error:', err);
        res.status(500).json({ message: 'File processing failed' });
    }
});

async function processExcelFile(buffer, originalname, userId) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    const connection = await pool.getConnection(); // Get a connection from the pool

    try {
        await connection.beginTransaction(); // Begin transaction

        // Insert into FileMetadata table
        const [fileResult] = await connection.query('INSERT INTO FileMetadata (filename, userid) VALUES (?, ?)', [originalname, userId]);

        const fileId = fileResult.insertId;

        // Prepare data for insertion into Accommodations table
        const data = jsonData.map(row => [
            row['Hotel Chain'],
            row['Room Type'],
            row['Number'],
            parseFloat(row['Price/night'].replace(/[^0-9.-]+/g, "")), // Removing dollar sign
            fileId
        ]);

        const sql = 'INSERT INTO Accommodations (hotel_chain, room_type, number, price_per_night, file_id) VALUES ?';

        await connection.query(sql, [data]);

        await connection.commit(); // Commit transaction

        console.log('Data inserted successfully');
    } catch (err) {
        await connection.rollback(); // Rollback transaction in case of error
        console.error('Database insert error:', err);
        throw err; // Rethrow the error to be caught in the calling function
    } finally {
        connection.release(); // Release the connection back to the pool
    }
}

module.exports = router;

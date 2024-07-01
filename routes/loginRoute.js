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
        const [rows] = await pool.query('SELECT id, email, role FROM users');

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


router.post('/upload/:type', authenticateToken, upload.array('files'), async (req, res) => {
    console.log("I am here");
    const files = req.files;

    const fileType = req.params.type;

    console.log(fileType);

    if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    try {
        // Process each uploaded fil
        for (const file of files) {
            if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {
                // Process Excel file
                if(fileType == 1){
                    await processExcelFileType1(file.buffer, file.originalname, req.user.id); // Assuming req.user.id contains the user ID
                }else if(fileType == 2){
                    await processExcelFileType2(file.buffer, file.originalname, req.user.id);
                }
                
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

async function processExcelFileType1(buffer, originalname, userId) {
    console.log("i am in file 1");
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    const connection = await pool.getConnection(); // Get a connection from the pool

    try {
        await connection.beginTransaction(); // Begin transaction

        // Insert into FileMetadata table
        const [fileResult] = await connection.query('INSERT INTO FileMetadata (filename, userid, sheet_type) VALUES (?, ?, 1)', [originalname, userId]);

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

async function processExcelFileType2(buffer, originalname, userId) {
    console.log("i am in file 2");
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[3];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    const connection = await pool.getConnection(); // Get a connection from the pool

    try {
        await connection.beginTransaction(); // Begin transaction

        // Insert into FileMetadata table
        const [fileResult] = await connection.query('INSERT INTO FileMetadata (filename, userid, sheet_type) VALUES (?, ?, 2)', [originalname, userId]);

        const fileId = fileResult.insertId;

        // Prepare data for insertion into Accommodations table
        const data = jsonData.map(row => [
            row['Room Type'],
            row['Quantity'],
            row['Current Price'],
            fileId
        ]);

        const sql = 'INSERT INTO RoomDetails (room_type, quantity, current_price, file_id) VALUES ?';

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

router.get('/filedata', authenticateToken,async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Accommodations');

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

// Route to get the filedata for a specific user
router.get('/filedata/:id', authenticateToken, async (req,res) => {
    
    const userId = req.params.id;

    const query = `SELECT a.hotel_chain,a.room_type,a.number,a.price_per_night FROM Accommodations a JOIN FileMetadata fm ON a.file_id = fm.id WHERE fm.userid = ?;`;

    try{
        const [results] = await pool.query(query, [userId]);
        res.status(200).json(results);
    }catch(err){
        console.error('Database query error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
})


// Route to delete a user by ID
router.delete('/user/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id;

    try {
        // Check if the user is an admin
        const [userResult] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);

        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userRole = userResult[0].role;
        if (userRole === 'admin') {
            return res.status(403).json({ message: 'Cannot delete an admin user' });
        }

        // Execute the delete query
        const [deleteResult] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Database delete error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;

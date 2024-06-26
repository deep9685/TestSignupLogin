require("dotenv").config();

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const connection = require('../db');



router.post('/', (req,res) => {
    
    const {email, password, role } = req.body;

    console.log(req.body);

      //Hash the password and save the user in the database
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Error hashing password." });
        }

        
        let q = "INSERT INTO users (email, password, role) VALUES (?, ?, ?)";
        let user = [email, hash, role];

        try {
          connection.query(q, user, (err, result) => {
            if (err) throw err;

            console.log(result);
            res.send(`Standard Signup post request: Welcome ${email}`);
          });
        } catch (err) {
          console.log(err.sqlMessage);
        }

      });

});

module.exports = router;
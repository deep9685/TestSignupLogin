require("dotenv").config();

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
// const connection = require('../db');
const pool = require('../db');
const {authenticateToken} = require("../middleware/authentication");




router.post('/', authenticateToken, async (req, res) => {
  const { name, email, password, role, category } = req.body;

  if(role === 'admin'){
    return res.status(500).json({message: "You can't set admin"});
  }

  if(req.user.role != 'admin'){
    return res.status(500).json({message: "Only admin can add a user"});
  }

  try {
      // Hash the password
      const hash = await bcrypt.hash(password, saltRounds);
      
      // Prepare the query and user data
      const q = "INSERT INTO users (name, email, password, role, category) VALUES (?, ?, ?, ?, ?)";
      const user = [name, email, hash, role, category];

      // Execute the query using the pool
      const [result] = await pool.query(q, user);
      
      console.log(result);
      res.send(`Standard Signup post request: Welcome ${email}`);
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
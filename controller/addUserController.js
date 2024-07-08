const bcrypt = require("bcrypt");
const saltRounds = 10;

const pool = require('../db');


// Function to handle adding a new User
async function handleAddUser(req, res) {
    const { name, email, password, role, category } = req.body;

    console.log("Request body:", req.body);

  if(role === 'admin'){
    return res.status(500).json({message: "You can't set admin"});
  }

  if(req.user.role != 'admin'){
    return res.status(500).json({message: "Only admin can add a user"});
  }

  try {

      // Convert the category array to a JSON string
      const categoryJson = JSON.stringify(category);

      // Hash the password
      const hash = await bcrypt.hash(password, saltRounds);
      
      // Prepare the query and user data
      const q = "INSERT INTO users (name, email, password, role, category) VALUES (?, ?, ?, ?, ?)";
      const user = [name, email, hash, role, categoryJson];

      console.log("Executing query:", q, "with data:", user);

      // Execute the query using the pool
      const [result] = await pool.query(q, user);
      
      console.log("Query result:", result);
      res.send(`Standard Signup post request: Welcome ${email}`);
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: "Internal server error", details: err.message });
  }
}

module.exports = {
    handleAddUser,
};
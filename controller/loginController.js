const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const xlsx = require("xlsx");

const pool = require("../db");


// Controller for login
async function handleLogin(req, res) {
    const { email, password } = req.body;

  if (!email || !password) {
    console.error("Email or password missing");
    return res.status(400).send("Email and password are required");
  }

  try {
    const [result] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (result.length > 0) {
      const user = result[0];

      const q = `SELECT c.id, c.category_name FROM users u JOIN category c ON JSON_CONTAINS(u.category, CAST(c.id AS JSON), '$') WHERE u.id = ${user.id};`;

      // const q = `SELECT GROUP_CONCAT(c.category_name) AS category_names FROM users u JOIN category c ON JSON_CONTAINS(u.category, CAST(c.id AS JSON), '$') WHERE u.id = ${user.id};`;
      const [category] = await pool.query(q);

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
            { expiresIn: "1h" }
          );
        } catch (error) {
          console.error("JWT signing error:", error);
          return res.status(500).send("Internal server error");
        }

        // return res.cookie('token', token).send(`Standard login post request: Welcome ${email}`);
        console.log("login request : ", user);
        return res
          .status(200)
          .json({ message: "Login successful", token, user, category});
        // return res.cookie('token', token, { httpOnly: true }).status(200).json({ message: 'Login successful', token, user });
      } else {
        console.log("Incorrect password");
        return res.status(401).send("Incorrect password");
      }
    } else {
      console.log("Email not found");
      return res.status(404).send("Email not found, please sign up");
    }
  } catch (err) {
    console.error("Database query error:", err);
    return res.status(500).send("Internal server error");
  }
};

// Controller to get all user data
async function handleGetAllUser(req, res){
    try {
        const [rows] = await pool.query(
          "SELECT u.id, u.name, u.email, u.role, GROUP_CONCAT(c.category_name ORDER BY c.category_name SEPARATOR ', ') AS category_names FROM users u LEFT JOIN category c ON JSON_CONTAINS(u.category, CAST(c.id AS JSON), '$') GROUP BY u.id, u.name, u.email, u.role;"
        );
    
        if (rows.length > 0) {
          return res.status(200).json(rows);
        } else {
          return res.status(404).json({ message: "No data found" });
        }
      } catch (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
}

// Controller to handle file upload of type 1 and 2
async function handleFileUpload(req, res) {
  console.log("I am here");

  const data = req.body;

  console.log("Json data : " , data);

  const fileType = req.params.type;

  console.log(fileType);

  try {
    if (fileType == 1) {
      
        // Process Excel file
          await processExcelFileType1(
            data,
            "test.xlsx",
            req.user.id
          );

      res.status(200).json({ message: "Files of Table 1 processed successfully" });
    } else if(fileType == 2){

      await processExcelFileType2(
        data,
        "test.xlsx",
        req.user.id
      );

      res.status(200).json({ message: "Files of Table 2 processed successfully" });

    } else {
      return res
        .status(400)
        .json({ message: "Unsupported sheet type, It should 1 or 2" });
    }
  } catch (err) {
    console.error("File processing error:", err);
    res.status(500).json({ message: "File processing failed" });
  }
}

// Function for excel uploading for table 1
async function processExcelFileType1(jsonData, originalname, userId) {
  console.log("I am in process file typ 1");

  const connection = await pool.getConnection(); // Get a connection from the pool

  try {
    await connection.beginTransaction(); // Begin transaction

    // Insert metadata into FileMetadata table
    const [metadataResult] = await connection.query(
      "INSERT INTO FileMetadata (filename, userid, sheet_type) VALUES (?, ?, 1)",
      [originalname, userId]
    );
    const fileId = metadataResult.insertId;

    // console.log(jsonData);

    // Prepare data for insertion into Table_1 using the mapping
    const data = jsonData.map((row) => [
      row["Text 1"] || null,
      row["Text 2"] || null,
      row["Text 3"] || null,
      row["Text 4"] || null,
      row["Text 5"] || null,
      row["Text 6"] || null,
      row["Text 7"] || null,
      row["Text 8"] || null,
      row["Text 9"] || null,
      row["Text 10"] || null,
      row["Text 11"] || null,
      row["Text 12"] || null,
      row["Text 13"] || null,
      row["Text 14"] || null,
      row["Numeric 1"] || null,
      row["Numeric 2"] || null,
      row["Numeric 3"] || null,
      row["Numeric 4"] || null,
      row["Numeric 5"] || null,
      row["Numeric 6"] || null,
      row["Numeric 7"] || null,
      row["Numeric 8"] || null,
      row["Numeric 9"] || null,
      row["Numeric 10"] || null,
      row["Numeric 11"] || null,
      row["Numeric 12"] || null,
      row["Spare Text 1"] || null,
      row["Spare Text 2"] || null,
      row["Spare Numeric 1"] || null,
      row["Spare Numeric 2"] || null,
      fileId,
    ]);

    const sql =
      "INSERT INTO Table_1 (Text1, Text2, Text3, Text4, Text5, Text6, Text7, Text8, Text9, Text10, Text11, Text12, Text13, Text14, Numeric1, Numeric2, Numeric3, Numeric4, Numeric5, Numeric6, Numeric7, Numeric8, Numeric9, Numeric10, Numeric11, Numeric12, SpareText1, SpareText2, SpareNumeric1, SpareNumeric2, file_id) VALUES ?";

    await connection.query(sql, [data]);

    await connection.commit(); // Commit transaction

    console.log("Data inserted successfully");
  } catch (err) {
    await connection.rollback(); // Rollback transaction on error
    console.error("Database insert error:", err);
    throw err; // Rethrow the error to be caught in the calling function
  } finally {
    connection.release(); // Release the connection back to the pool
  }
}

// Function for excel uploading for table 2
async function processExcelFileType2(jsonData, originalname, userId) {

  console.log("I am in process file typ 2");
  
  const connection = await pool.getConnection(); // Get a connection from the pool

  try {
    await connection.beginTransaction(); // Begin transaction

    // Insert metadata into FileMetadata table
    const [metadataResult] = await connection.query(
      "INSERT INTO FileMetadata (filename, userid, sheet_type) VALUES (?, ?, 2)",
      [originalname, userId]
    );
    const fileId = metadataResult.insertId;

    // Prepare data for insertion into Table_1 using the mapping
    const data = jsonData.map((row) => [
      row["Text 1"] || null,
      row["Numeric 1"] || null,
      row["Numeric 2"] || null,
      row["Numeric 3"] || null,
      row["Text 2"] || null,
      fileId,
    ]);

    const sql =
      "INSERT INTO Table_2 (Text1, Numeric1, Numeric2, Numeric3, Text2, file_id) VALUES ?";

    await connection.query(sql, [data]);

    await connection.commit(); // Commit transaction

    console.log("Data inserted successfully");
  } catch (err) {
    await connection.rollback(); // Rollback transaction on error
    console.error("Database insert error:", err);
    throw err; // Rethrow the error to be caught in the calling function
  } finally {
    connection.release(); // Release the connection back to the pool
  }
}

// Controller to get excel file data
async function handleGetFiledata(req, res){
  try {
    const [rows] = await pool.query("SELECT * FROM Table_1");

    if (rows.length > 0) {
      return res.status(200).json(rows);
    } else {
      return res.status(404).json({ message: "No data found" });
    }
  } catch (err) {
    console.error("Database query error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Controller to get File data of Table 1 for a specific user
async function handleGetUserSpecificFiledata1(req, res) {
  const userId = req.params.id;
  const categoryId = req.params.category_id;

  const query = `SELECT t.Text1,t.Text2, t.Text3, t.Text4, t.Text5, t.Text6, t.Text7, t.Text8, t.Text9, t.Text10, t.Text11, t.Text12, t.Text13, t.Text14, t.Numeric1, t.Numeric2, t.Numeric3, t.Numeric4, t.Numeric5, t.Numeric6, t.Numeric7, t.Numeric8, t.Numeric9, t.Numeric10, t.Numeric11, t.Numeric12, t.SpareText1, t.SpareText2, t.SpareNumeric1, t.SpareNumeric2 FROM Table_1 t JOIN FileMetadata fm ON t.file_id = fm.id WHERE fm.userid = ? AND fm.category_id = ?;`;

  try {
    const [results] = await pool.query(query, [userId, categoryId]);
    res.status(200).json(results);
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ message: "Internal server error", err });
  }
}

// Controller to get File data of Table 2 for a specific user
async function handleGetUserSpecificFiledata2(req, res) {
  const userId = req.params.id;
  const categoryId = req.params.category_id;

  const query = `SELECT t.Text1,t.Numeric1, t.Numeric2, t.Numeric3, t.Text2 FROM Table_2 t JOIN FileMetadata fm ON t.file_id = fm.id WHERE fm.userid = ? AND fm.category_id = ?;`;

  try {
    const [results] = await pool.query(query, [userId, categoryId]);
    res.status(200).json(results);
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Controller to delete a user by its id
async function handleDeleteUser(req, res){
  const userId = req.params.id;

  try {
    // Check if the user is an admin
    const [userResult] = await pool.query(
      "SELECT role FROM users WHERE id = ?",
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRole = userResult[0].role;
    if (userRole === "admin") {
      return res.status(403).json({ message: "Cannot delete an admin user" });
    }

    // Execute the delete query
    const [deleteResult] = await pool.query("DELETE FROM users WHERE id = ?", [
      userId,
    ]);

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Database delete error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Controller to handle variable data file
async function handleVariableDataUpload(req, res){
  const data = req.body;
  const keys = Object.keys(data);
  const values = Object.values(data);

  console.log(req.body);

  const connection = await pool.getConnection(); // Get a connection from the pool

  try {
    await connection.beginTransaction(); // Begin transaction

    // Insert metadata into FileMetadata table
    const [metadataResult] = await connection.query(
      "INSERT INTO FileMetadata (filename, userid, sheet_type) VALUES (?, ?, 3)",
      [originalname, userId]
    );
    const fileId = metadataResult.insertId;

    // Add 'file_id' to the keys and fileId to the values
    keys.push('file_id');
    values.push(fileId);

    // Prepare the query and data
    const q = `INSERT INTO Table_3 (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')}))`;

    await connection.query(q, values);

    await connection.commit(); // Commit transaction

    console.log("Data inserted successfully");

    res.status(200).json({ message: "Data Inserted successfully" });
  } catch (err) {
    await connection.rollback(); // Rollback transaction on error
    console.error("Database insert error:", err);
    throw err; // Rethrow the error to be caught in the calling function
  } finally {
    connection.release(); // Release the connection back to the pool
  }
}

// Controller to get all category data
async function handleGetAllCategory(req, res){
  try {
      const [rows] = await pool.query(
        "SELECT * FROM category"
      );
  
      if (rows.length > 0) {
        return res.status(200).json(rows);
      } else {
        return res.status(404).json({ message: "No data found" });
      }
    } catch (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
}



module.exports = {
    handleLogin,
    handleGetAllUser,
    handleFileUpload,
    handleGetFiledata,
    handleGetUserSpecificFiledata1,
    handleGetUserSpecificFiledata2,
    handleDeleteUser,
    handleVariableDataUpload,
    handleGetAllCategory
};
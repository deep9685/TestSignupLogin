require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const xlsx = require("xlsx");

const { authenticateToken } = require("../middleware/authentication");

// const connection = require('../db');
const pool = require("../db");

router.use(express.json()); // Middleware to parse JSON data
router.use(express.urlencoded({ extended: true }));

const {
        handleLogin,
        handleGetAllUser,
        handleFileUpload,
        handleGetFiledata,
        handleGetUserSpecificFiledata,
        handleDeleteUser,
        handleVariableDataUpload,
        handleGetAllCategory,

                          } = require('../controller/loginController')


// Route for Login
router.post("/", handleLogin);

// ------------------------------------------------------------------------------------>

// Route to get User Data
router.get("/data", authenticateToken, handleGetAllUser);


// for testing purpose 
router.get("/upload", (req, res) => {
  res.render("fileupload.ejs");
});

//------------------------------------------------------------------------> 

// Setup Multer for file uploads
// const upload = multer({ storage: multer.memoryStorage() });

// // Route to handle excel data of type 1 and 2
// router.post("/upload/:type", authenticateToken, upload.array("files"), handleFileUpload);

// Set up Multer storage and configure the file upload
// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
// }).array('files'); // Expect multiple files under the field name 'files'

// // Route to handle excel data of type 1 and 2
router.post('/upload/:type', authenticateToken, async (req, res) => {
  console.log("I am here");
    // const files = req.files;

    const data = req.body;

    console.log("Json data : " , data);

    // console.log("Files data : " ,files);

    const fileType = req.params.type;

    console.log(fileType);

    // if (!files || files.length === 0) {
    //   return res.status(400).json({ message: "No files were uploaded." });
    // }

    try {
      if (fileType == 1) {
        
          // Process Excel file
            await processExcelFileType1(
              data,
              test.xlsx,
              req.user.id
            );

        res.status(200).json({ message: "Files processed successfully" });
      }  else {
        return res
          .status(400)
          .json({ message: "Unsupported sheet type, It should 1 or 2" });
      }
    } catch (err) {
      console.error("File processing error:", err);
      res.status(500).json({ message: "File processing failed" });
    }
});

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

    console.log(jsonData);

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

// ------------------------------------------------------------------------------------->

// Route for handling table 3 (variable data)
router.post("/variabledata", authenticateToken, handleVariableDataUpload);
// router.post("/variabledata", authenticateToken, async (req, res) => {
//   const {
//     PercentField1,
//     PercentField2,
//     DropDown1,
//     PercentField3,
//     PercentField4,
//     PercentField5,
//     PercentField6,
//     PercentField7,
//     PercentField8,
//     TextField1,
//     TextField2,
//     TextField3,
//     TextField4,
//     TextField5,
//     TextField6,
//     DropDown2,
//     PercentField9,
//     PercentField10,
//     PercentField11,
//     PercentField12,
//     PercentField13,
//     PercentField14,
//     PercentField15,
//     TextField7,
//     TextField8,
//     TextField9,
//     TextField10,
//     TextField11,
//     TextField12,
//     PercentField16,
//     PercentField17,
//     PercentField18,
//     PercentField19,
//     PercentField20,
//     PercentField21,
//     TextField13,
//     TextField14,
//     TextField15,
//     TextField16,
//     TextField17,
//     TextField18,
//     PercentField22,
//     PercentField23,
//     PercentField24,
//     PercentField25,
//     PercentField26,
//     PercentField27,
//     TextField19,
//     TextField20,
//     TextField21,
//     TextField22,
//     TextField23,
//     TextField24,
//     PercentField28,
//     PercentField29,
//     PercentField30,
//     PercentField31,
//     PercentField32,
//     PercentField33,
//     TextField25,
//     TextField26,
//     TextField27,
//     TextField28,
//     TextField29,
//     TextField30,
//     PercentField34,
//     PercentField35,
//     PercentField36,
//     PercentField37,
//     PercentField38,
//     PercentField39,
//     TextField31,
//     TextField32,
//     TextField33,
//     TextField34,
//     TextField35,
//     TextField36,
//   } = req.body;

//   console.log(req.body);

//   const connection = await pool.getConnection(); // Get a connection from the pool

//   try {
//     await connection.beginTransaction(); // Begin transaction

//     // Insert metadata into FileMetadata table
//     const [metadataResult] = await connection.query(
//       "INSERT INTO FileMetadata (filename, userid, sheet_type) VALUES (?, ?, 3)",
//       [originalname, userId]
//     );
//     const fileId = metadataResult.insertId;

//     // Prepare the query and data
//     const q = `
//         INSERT INTO Table_3 (
//           PercentField1, PercentField2, DropDown1, PercentField3, PercentField4,
//           PercentField5, PercentField6, PercentField7, PercentField8, TextField1,
//           TextField2, TextField3, TextField4, TextField5, TextField6, DropDown2,
//           PercentField9, PercentField10, PercentField11, PercentField12, PercentField13,
//           PercentField14, PercentField15, TextField7, TextField8, TextField9, TextField10,
//           TextField11, TextField12, PercentField16, PercentField17, PercentField18,
//           PercentField19, PercentField20, PercentField21, TextField13, TextField14,
//           TextField15, TextField16, TextField17, TextField18, PercentField22,
//           PercentField23, PercentField24, PercentField25, PercentField26, PercentField27,
//           TextField19, TextField20, TextField21, TextField22, TextField23, TextField24,
//           PercentField28, PercentField29, PercentField30, PercentField31, PercentField32,
//           PercentField33, TextField25, TextField26, TextField27, TextField28, TextField29,
//           TextField30, PercentField34, PercentField35, PercentField36, PercentField37,
//           PercentField38, PercentField39, TextField31, TextField32, TextField33,
//           TextField34, TextField35, TextField36, file_id
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//     const data = [
//       PercentField1,
//       PercentField2,
//       DropDown1,
//       PercentField3,
//       PercentField4,
//       PercentField5,
//       PercentField6,
//       PercentField7,
//       PercentField8,
//       TextField1,
//       TextField2,
//       TextField3,
//       TextField4,
//       TextField5,
//       TextField6,
//       DropDown2,
//       PercentField9,
//       PercentField10,
//       PercentField11,
//       PercentField12,
//       PercentField13,
//       PercentField14,
//       PercentField15,
//       TextField7,
//       TextField8,
//       TextField9,
//       TextField10,
//       TextField11,
//       TextField12,
//       PercentField16,
//       PercentField17,
//       PercentField18,
//       PercentField19,
//       PercentField20,
//       PercentField21,
//       TextField13,
//       TextField14,
//       TextField15,
//       TextField16,
//       TextField17,
//       TextField18,
//       PercentField22,
//       PercentField23,
//       PercentField24,
//       PercentField25,
//       PercentField26,
//       PercentField27,
//       TextField19,
//       TextField20,
//       TextField21,
//       TextField22,
//       TextField23,
//       TextField24,
//       PercentField28,
//       PercentField29,
//       PercentField30,
//       PercentField31,
//       PercentField32,
//       PercentField33,
//       TextField25,
//       TextField26,
//       TextField27,
//       TextField28,
//       TextField29,
//       TextField30,
//       PercentField34,
//       PercentField35,
//       PercentField36,
//       PercentField37,
//       PercentField38,
//       PercentField39,
//       TextField31,
//       TextField32,
//       TextField33,
//       TextField34,
//       TextField35,
//       TextField36,
//       fileId,
//     ];

//     await connection.query(q, [data]);

//     await connection.commit(); // Commit transaction

//     console.log("Data inserted successfully");

//     res.status(200).json({ message: "Data Inserted successfully" });
//   } catch (err) {
//     await connection.rollback(); // Rollback transaction on error
//     console.error("Database insert error:", err);
//     throw err; // Rethrow the error to be caught in the calling function
//   } finally {
//     connection.release(); // Release the connection back to the pool
//   }
// });

// --------------------------------------------------------------------------------->

// Route to get Excel file data 
router.get("/filedata", authenticateToken, handleGetFiledata);

// --------------------------------------------------------------------------------->

// Route to get the filedata for a specific user
router.get("/filedata/:id", authenticateToken, handleGetUserSpecificFiledata);

// --------------------------------------------------------------------------------->

// Route to delete a user by ID
router.delete("/user/:id", authenticateToken, handleDeleteUser);

// --------------------------------------------------------------------------------->

// Route to get all category
router.get("/category", authenticateToken, handleGetAllCategory);

module.exports = router;

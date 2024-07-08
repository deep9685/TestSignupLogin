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
        handleDeleteUser,
        handleVariableDataUpload,
        handleGetAllCategory,
        handleGetUserSpecificFiledata2,
        handleGetUserSpecificFiledata1,
        handleEditUser,

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

// // Route to handle excel data of type 1 and 2
router.post('/upload/:type', authenticateToken, handleFileUpload);


// ------------------------------------------------------------------------------------->

// Route for handling table 3 (variable data)
router.post("/variabledata", authenticateToken, handleVariableDataUpload);

// --------------------------------------------------------------------------------->

// Route to get Excel file data 
router.get("/filedata", authenticateToken, handleGetFiledata);

// --------------------------------------------------------------------------------->

// Route to get the filedata for Table 1 for a specific user
router.get("/filedata1/:id/:category_id", authenticateToken, handleGetUserSpecificFiledata1);

// Route to get the filedata for Table 1 for a specific user
router.get("/filedata2/:id/:category_id", authenticateToken, handleGetUserSpecificFiledata2);

// --------------------------------------------------------------------------------->

// Route to delete a user by ID
router.delete("/user/:id", authenticateToken, handleDeleteUser);

// --------------------------------------------------------------------------------->

// Route to Edit a user data by ID
router.patch("/user/:id", authenticateToken, handleEditUser)

// ------------------------------------------------------------------------------------->

// --------------------------------------------------------------------------------->

// Route to get all category
router.get("/category", authenticateToken, handleGetAllCategory);

module.exports = router;

const express = require("express");
const router = express.Router();

const {authenticateToken} = require("../middleware/authentication");
const {handleAddUser} = require('../controller/addUserController');


// Route to Add a user
router.post('/', authenticateToken, handleAddUser);

module.exports = router;
require("dotenv").config();
const JWT = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;

function validateToken(token){
    const payload = JWT.verify(token, secret);
    return payload;
}

module.exports = {
    validateToken,
};
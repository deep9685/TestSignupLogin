const JWT = require("jsonwebtoken");

const secret = "WaterinOcean";

function validateToken(token){
    const payload = JWT.verify(token, secret);
    return payload;
}

module.exports = {
    validateToken,
};
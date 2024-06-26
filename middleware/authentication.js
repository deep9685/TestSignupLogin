const {validateToken} = require("../services/authentication");

function checkForAuthenticationCookie(cookieName){
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];

        if(!tokenCookieValue){
            
            return res.status(404).send('token not found');
            
            // return next()
        }

        try{
            const userPayload = validateToken(tokenCookieValue);
            req.user = userPayload;
            // console.log(userPayload);
            return next();  
        }catch(error) {
            return res.status(404).send('token not generated');
        }
    };   
}

module.exports ={
    checkForAuthenticationCookie,
};
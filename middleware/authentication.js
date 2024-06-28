const {validateToken} = require("../services/authentication");

// function checkForAuthenticationCookie(cookieName){
//     return (req, res, next) => {
//         const tokenCookieValue = req.cookies[cookieName];

//         if(!tokenCookieValue){
            
//             return res.status(404).send('token not found');
            
//             // return next()
//         }

//         try{
//             const userPayload = validateToken(tokenCookieValue);
//             req.user = userPayload;
//             // console.log(userPayload);
//             return next();  
//         }catch(error) {
//             return res.status(404).send('token not generated');
//         }
//     };   
// }

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
  
    if (!authHeader || !authHeader.trim().startsWith('Bearer ')) {
      console.log('No token provided or invalid Authorization header format');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
  
    const token = authHeader.trim().split(' ')[1];
    
    try {
      const decoded = validateToken(token);
      console.log('Decoded Token:', decoded); // Log the decoded token
      req.user = decoded;
      console.log(req.user.id);
      next();
    } catch (error) {
      console.log('Invalid token:', error.message);
      res.status(403).json({ error: 'Invalid token.' });
    }
  };

module.exports ={
    authenticateToken,
};
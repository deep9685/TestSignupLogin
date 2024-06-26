require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {checkForAuthenticationCookie} = require("../middleware/authentication")


const connection = require('../db');

router.post('/dashboard', (req, res) => {
    const {email, password} = req.body;

    // console.log(req.body);

    //now checking email and password against database
    connection.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if(err) throw err;

        if(result.length > 0)
        {
            const user = result[0];
            
            bcrypt.compare(password, user.password, (bcryptErr, bcryptResult) => {
                
                if(bcryptResult)
                {
                    let token;
                    try {
                        token = jwt.sign(
                            {
                                email: user.email,
                                role:  user.role,
                            },
                            process.env.JWT_SECRET,
                            { expiresIn: "1h" }
                        );
                    } catch (error) {
                        
                    }
                
                    // res.send('Login Successfull.'); 
                    // res.send('Welcome to the dashboard, ' + user.email + '!');
                    // res.render('welcome.ejs',{user});

                    return res.cookie("token", token).render('welcome.ejs',{user});
            
                }
                else
                {
                    res.redirect('/login');

                }
            });
        }
        else
        {
            res.redirect('/signup');
            
        }
    });
});

router.get('/dashboard/resources', checkForAuthenticationCookie("token"), (req, res) => {
    console.log("I am in resource route");

    res.status(201).json({
                success: true,
                data: {
                    userId: "123",
                    email: "deepak@gamil.com",
                },
            });
});

module.exports = router;

'use strict';

// =======================
// get the packages we need ============
// =======================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const cookieParser = require('cookie-parser');
app.use(cookieParser());

var config = require('./config'); // get our config file (mongoDB)

var User = require('./app/models/user'); // get our mongoose model

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
app.set('superSecret', config.secret); // secret variable  //variable environnement app.get('superSecret');


mongoose.connect(config.database); // connect to database

app.set('view engine', 'ejs');




// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
// basic route
app.get('/', function (req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});


//Register
app.get('/setup', function (req, res) {


    // create a sample user
    var nick = new User({
        name: 'Nick Cerminara',
        password: 'password',
        admin: true
    });

    // save the sample user
    nick.save(function (err) {
        if (err) throw err;

        console.log('User saved successfully');
        res.json({success: true});
    });
});


// API ROUTES -------------------


// get an instance of the router for api routes
var apiRoutes = express.Router();
// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);



// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function (req, res) {
    res.json({message: 'Welcome to the coolest API on earth!'});
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function (req, res) {
    User.find({}, function (err, users) {
        console.log((users));
        res.json(users);
    });
});


//A mettre sur l'app 
app.get('/login', function(req,res){

    res.render('login');
});


// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/login', function (req, res) { // /api/login POST => name / password
    // find the user

    User.findOne({
        name: req.body.name
    }, function (err, user) {

        if (err) throw err;

        if (!user) {
            res.json({success: false, message: 'Login failed. User not found.'});
            console.log(user);
            //redirect to inscription page
        } else if (user) {
            // check if password matches
            if (user.password != req.body.password) {
                res.json({success: false, message: 'Login failed. Wrong password.'});
            } else {

                // if user is found and password is right
                // create a token
                var token = jwt.sign({"name": user.name, "password": user.password}, app.get('superSecret'), {
                    expiresIn: "1d" // d h etc
                });

                res.cookie('token',token);
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }

        }

    });
});


// STORE TOKEN DANS LE HEADER x-access-token



// =======================
// SECURITY FOR EACH API ROUTES with JWT =========
// =======================
// route middleware to verify a token
apiRoutes.use(function (req, res, next) {


    console.log("YOUR COOKIE => " . req.cookies.token);

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies.token;

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
            if (err) {
                return res.json({success: false, message: 'Failed to authenticate token.'});
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});

// route to show a random message (GET http://localhost:8080/api/)

// route to return all users (GET http://localhost:8080/api/users)


// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
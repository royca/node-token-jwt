// =======================
// get the packages we need ============
// =======================

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); //get our config file
var User = require('./app/models/user'); // get our mongoose model


// =======================
// configuration =========
// =======================

var port = process.env.PORT || 3000; //// used to create, sign, and verify tokens
mongoose.connect(config.database); //connect to database
app.set('superSecret',config.secret); //secret key

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended : false}));
app.use(bodyParser.json());

//use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res){
	res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.get('/setup', function(req,res){

	//create a sample user
	var roy =  new User({
		name : 'Roy Rebello',
		password : 'abc123',
		admin : true
	});

	//save the sample user
	roy.save(function(err) {
		if(err)
			throw err;
		console.log('User created successfully');
		res.json({success:true});
	});
});

// API ROUTES -------------------
//get an instanc eof the routes for api routes
var apiRoutes =  express.Router();

// TODO: route to authenticate a user (POST http://localhost:3000/api/authenticate)
apiRoutes.post('/authenticate', function(req,res){

	//find the user
	User.findOne({
		name : req.body.name
	}, function(err, user){
		if(err) throw err;
		if(!user){
			res.json({success:false, message: 'Authentication failed. User not found.'});
		} else if(user) {
			//check if password matches
			if(user.password!=req.body.password){
				res.json({success:false, message :'Authentication failed. Wrong password.'});
			} else {
				//if user is found and password is right
				//create a token
				var token = jwt.sign(user,app.get('superSecret'), {
					expiresInMinutes:1440 // expires in 24 hours
				});

				//return the inforamtion including token as JSON
				res.json({
					success : true,
					message : 'Enjoy your token!',
					token : token
				});
			}
		}
	});
});

// TODO: route middleware to verify a token
apiRoutes.use(function(req,res,next){
	// check header or url parameters or post parameters for token
	var token = req.body.token || req.query.token ||req.headers['x-access-token'];

	//decode token
	if(token){
		//verifies secret anf checks exp
		jwt.verify(token, app.get('superSecret'), function(err,decoded){
			if(err) {
				return res.json({success:false , message: 'Failed to authenticate token.'});
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
			success : false,
			message : 'No token provided.'
		});
	}
});

// route to show a random message (GET http://localhost:3000/api/)
apiRoutes.get('/',function(req,res){
	res.json({message:'Weclome to the coolest API on earth!'});
});

// route to return all users (GET http://localhost:3000/api/users)
apiRoutes.get('/users', function(req,res){
	User.find({}, function(err , users){
		res.json(users);
	});
});

// apply the routes to our application with the prefix /api
app.use('/api',apiRoutes);

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magin happens at http://localhost:'+port);



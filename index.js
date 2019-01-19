const express = require("express");
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require("mongoose");

var User = require('./models/user');
const app = express();

app.use(session({
  secret: "You can write anything you can feel like here",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
mongoose.connect('mongodb://localhost:27017/mystore')

var mystoreSchema = new mongoose.Schema({
	title: String,
	price: Number,
	inventory_count: Number
});

var MyStore = mongoose.model("MyStore" , mystoreSchema)

app.get('/',(req,res) => {
  res.send("SHOPIFY INTERN SUMMER CHALLENGE");
});
app.get('/productinfo',(req,res) => {
  MyStore.find({title: req.query.title}, function(err, response){
			if(response.length === 0)
			{
        if (req.query.title === undefined) {
          res.send("You need to add title field in the URL to check inventory like /productinfo/?title=whatever.");
        }
        else {
          res.send("Sorry no such item exist in the store. Please check the name and try again");
        }
			}
			else
			{
				res.send({
          title: response[0].title,
          price_in_CAD: response[0].price,
          inventory_count: response[0].inventory_count
        });
			}
		});
});
app.get('/allproducts',(req,res) => {
  MyStore.find({},function(err, response){
			if(response.length === 0)
			{
				res.send("Sorry store inventory is empty at the moment.");
			}
			else
			{
        var inventory = [];
        response.forEach(function(response1) {
          //console.log(response1);
          var a = {
            title: response1.title,
            price_in_CAD: response1.price,
            inventory_count: response1.inventory_count
          }
          //console.log(a);
          inventory.push(a);
        });
        res.send(inventory);
			}
		});
});
app.post('/buy',(req,res) => {
  MyStore.find({title: req.query.title}, function(err, response){
			if(response.length === 0)
			{
        if (req.query.title === undefined || req.query.quantity === undefined) {
          res.send("You need to add title field in the URL to check inventory like /buy/?title=whatever&quantity=whatever.");
        }
        else {
          res.send("Sorry no such item exist in the store. Please check the name and try again");
        }
			}
			else
			{
				if(response[0].inventory_count === 0)
        {
          res.send("Sorry this item is currently out of stock. Please try again later.");
        }
        else if(response[0].inventory_count < req.query.quantity)
        {
          res.send(`Sorry we currently have only ${response[0].inventory_count} items left in the store.`);
        }
        else {
					CheckIn.update({title: req.query.title} , {$inc: {inventory_count : -1}} , function(err , as) {
            if(err){
              console.log(err);
            }
					});
          res.send("Item has successfully added to your cart.");
        }
			}
		});
});

app.post('/register', function(req, res) {
  // Here we will add the user into the database (we will use User.register provide by passportLocalMongoose)
  var username = req.query.username;
  var email = req.query.email;
  var newUser = new User({username: username, email: email});
  User.register(newUser, req.query.password, function(err, user) {
    if(err) {
      console.log(err);
    }
    else {
      passport.authenticate('local')(req, res, function() {
        res.render("You have successfully Registered.");
      });
    }
  });

});

app.post('/login', passport.authenticate('local'), function(req, res) {
    res.render("You have successfully logged in.");
  });

app.listen(3000);

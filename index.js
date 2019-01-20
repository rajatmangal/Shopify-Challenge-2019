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
  if(!req.user) {
    res.send("Welcome to Rajat's Stores. Please sign in to start shopping.");
  }
  else {
    res.send(`Welcome ${req.user.username}. You can start adding stuff in your cart.`);
  }

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
  if(!req.user)
  {
    res.redirect("/");
  }
  else {
    MyStore.find({title: req.query.title}, async function(err, response){
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
            var available = 0;
            await User.find({username:req.user.username},(err, res1) => {
              res1[0].cart.forEach(function(res2) {
                if(res2.title === req.query.title)
                {
                  available = 1;
                  res.send("Sorry the item is already in your cart. You cant add an item twice.")
                }
              })
              if(available===0)
              {
                var totalPrice = (response[0].price*req.query.quantity);
                var totalPrice1 = req.user.total + (response[0].price*req.query.quantity);
                User.update({username: req.user.username}, {$push: {cart: {title: req.query.title, quantity:req.query.quantity, price: totalPrice}}}, function(err, result) {
                  if(err){
                    throw err;
                  }
                });
                User.update({username: req.user.username}, {$set: {total: totalPrice1}}, function(err, result) {
                  if(err){
                    throw err;
                  }
                });
                res.send("Item has successfully been added to your cart.");
              }
            })
          }
        }
      });
  }
});

app.get("/loginagain", (req,res) => {
  res.send("Sorry, either username or passord is wrong. Please sign in again.")
});

app.post('/register', function(req, res) {
  // Here we will add the user into the database (we will use User.register provide by passportLocalMongoose)
  var username = req.query.username;
  var email = req.query.email;
  var newUser = new User({username: username, email: email});
  User.register(newUser, req.query.password, function(err, user) {
    if(err) {
      res.send(err.message);
    }
    else {
      passport.authenticate('local')(req, res, function() {
        res.redirect("/");
      });
    }
  });

});

app.post('/login',passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/loginagain' }));

app.get('/logout', function(req, res) {
  req.logout(); // This comes from the packages that we have installed
  res.redirect('/');
});

app.get('/mycart',(req,res) => {
  if(!req.user) {
    res.send("You need to sign in to check your cart");
  }
  else {
    User.find({username: req.user.username}, function(err, result) {
      if(err){
        throw err;
      }
      else {
        res.send({
          items: result[0].cart,
          total_in_CAD: result[0].total
        });
      }
    });
  }
})

app.get('/completecart',async (req,res)=>{
  if(!req.user) {
    res.send("You need to sign in to check your cart");
  }
  else {
    var db = []
    var total;
    await User.find({username: req.user.username}, async function(err, result) {
      if(err){
        throw err;
      }
      else {
        await result[0].cart.forEach(async function(response) {
          await MyStore.find({title: response.title}, async function(err , res) {
            if(err){
              console.log(err);
            }
            if(res[0].inventory_count >= response.quantity)
            {
              await MyStore.update({title: response.title} , {$inc: {inventory_count : -response.quantity}} , function(err , as) {
                if(err){
                  console.log(err);
                }
              });
            }
            else {
              await MyStore.update({title: response.title} , {$set: {inventory_count : 0}} , function(err , as) {
                if(err){
                  console.log(err);
                }
              });
            db.push({
                title: response.title,
                quantity: response.quantity-res[0].inventory_count
              });
            }
          });
        });
        total = result[0].total;
        db.forEach(function(response) {
          total = total-response.price;
        });
        User.update({username: req.user.username}, {$set: {cart: [], total: 0}}, function(err, result) {
          if(err){
            throw err;
          }
        });
        if(db.length === 0)
        {
            res.send(`Your transaction has been completed. A total of $ ${total} has been charged from your credit card.`);
        }
        else {
          res.send({
            note: `Your transaction has been completed. A total of $ ${total} has been charged from your credit card. But some of the itms are out of stock that were in the cart. The products that went out of stock are the following:`,
            products: db
          });
        }
      }
    });
  }
});

app.listen(3000);

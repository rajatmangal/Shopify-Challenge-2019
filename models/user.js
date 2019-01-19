var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  cart: [{
    title: String,
    quantity: Number,
    price: Number
  }]
});

// This adds some methods to the UserSchema
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);

// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var autoIncrement = require('mongoose-auto-increment');


// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        memberid    : Number,
        uname         : String,
        phone        : String,
        email        : String,
        password     : String,
        fee          : Number,
        memberSince  : String,
        paid         : Number, 
        clearUpto    : String,
        due          : Number, 
        donation     : Number, 
        status       : String, 

        resetPasswordToken: String,
        resetPasswordExpires: Date
    }
    /**facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }**/

});

//autoincrement member id
userSchema.plugin(autoIncrement.plugin, { model: 'User', field: 'memberid',   startAt: 1 });

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);



// app/models/transaction.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our transaction model
var transactionSchema = mongoose.Schema({

    
        
        email  : String,
        amount : Number,
        type   : String,
        date   : String,
        givento: String,        
        status : String 

        
    

});


// create the model for users and expose it to our app
module.exports = mongoose.model('Transaction', transactionSchema);

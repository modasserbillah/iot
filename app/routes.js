// app/routes.js
module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs', {user : req.user
        }); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage'), user: req.user }); 
    

    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));


    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    
    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/login', // redirect to the login section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    /*********************forgot password section****************/
    
    //get the tools
    var async = require('async');
    var crypto = require('crypto');
    var nodemailer = require('nodemailer');
    // load up the user model
    var User = require('../app/models/user');

    app.get('/forgot', function(req, res) {
        res.render('forgot', { message: req.flash('info'),
        user: req.user
      });
    });

    app.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ 'local.email' :  req.body.email }, function(err, user) {
        if (!user) {
          req.flash('info', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.local.resetPasswordToken = token;
        user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'Gmail',
        auth: {
          user: 'islamicotrust@gmail.com',
          pass: 'iotiotiot'
        }
      });
      var mailOptions = {
        to: user.local.email,
        from: 'islamicotrust@gmail.com',
        subject: 'IOT Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.local.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

        //reset the password
        app.get('/reset/:token', function(req, res) {
          User.findOne({ 'local.resetPasswordToken': req.params.token, 'local.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
            if (!user) {
              req.flash('info', 'Password reset token is invalid or has expired.');
              return res.redirect('/forgot');
            }
            res.render('reset', {
              user: req.user, message: req.flash('info'), token: req.params.token
            });
          });
        });

        //reset password post method
        app.post('/reset/:token', function(req, res) {
          async.waterfall([
            function(done) {
              User.findOne({ 'local.resetPasswordToken': req.params.token, 'local.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                  req.flash('info', 'Password reset token is invalid or has expired.');
                  return res.redirect('/forgot', {message: req.flash('info')});
                }

                user.local.password = user.generateHash(req.body.password);
                user.local.resetPasswordToken = undefined;
                user.local.resetPasswordExpires = undefined;

                user.save(function(err) {
                  //req.logIn(user, function(err) {
                    done(err, user);
                  });
                });
              },
            
            function(user, done) {
              var smtpTransport = nodemailer.createTransport('SMTP', {
                service: 'Gmail',
                auth: {
                  user: '',
                  pass: ''
                }
              });
              var mailOptions = {
                to: user.local.email,
                from: 'islamicotrust@gmail.com',
                subject: 'Your password has been changed in IOT',
                text: 'Hello,\n\n' +
                  'This is a confirmation that the password for your account at IOT ' + user.local.email + ' has just been changed.\n'
              };
              smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('info', 'Success! Your password has been changed.');
                done(err);
              });
            }
          ], function(err) {
            res.redirect('/login');
          });
        });




    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        //req.session.email = req.user.local.email;
        var Transaction = require('../app/models/transaction');
        Transaction.find({'email' : req.user.local.email}, function(err, transactions){
            if (err)
                return done(err);
            res.render('profile.ejs', {
            transactions: transactions,
            user : req.user
            
        });
        });
        
        
    });

    //EDIT PERSONAL INFO
    app.post('/profile/edit',  function(req,res){
            //email = req.session.email;
            // get a user with ID of 1
            var User = require('../app/models/user');
                User.findOne({ 'local.email' :  req.user.local.email }, function(err, user) {
                  if (err)
                    return done(err);

                  // change the users info
                  else
                    
                      user.local.uname = req.body.uname;
                      user.local.phone = req.body.phone;
                      user.local.email = req.body.email;
                      user.local.fee = req.body.fee;


                  // save the user
                  user.save(function(err) {
                    if (err) throw err;

                    //console.log('User successfully updated!');
                    res.redirect('/profile');
                  });

                });
    });

    //CHANGE PASSWORD
    app.post('/profile/changepass', function(req,res){
        var User = require('../app/models/user');
        User.findOne({'local.email' : req.user.local.email}, function(err, user){
                if (err)
                    return done (err);
            
                

                user.local.password = user.generateHash(req.body.newpass);

                user.save(function(err) {
                    if (err) throw err;

                    //console.log('User successfully updated!');
                    res.redirect('/profile');
                  });

        });
    });


    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
var Transaction = require('../app/models/transaction');
        
    // ================================================
// ADMIN MENU
// ================================================
    app.get ('/admin', function (req, res) {
        var User = require('../app/models/user');
        var Transaction = require('../app/models/transaction');
        User.find({}, function(err, users){
                if (err)
                    return done (err);
                Transaction.find({'status' : 'Pending'}, function(err, trans){
                    if (err)
                    return done (err);
                Transaction.find({}, function(err, transactions){
                 if (err)
                    return done(err);
                        
            res.render ('admin.ejs', {members: users, user: req.user, trans: trans, transactions: transactions});
            
        });
        });
                
            });
    

    });//end of app.get.admin

    app.post('/adminadd', function(req, res){
        User.findOne({ 'local.email' :  req.body.email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {

                // if there is no user with that email
                // create the user
                var newUser            = new User();

                // set the user's local credentials
                newUser.local.email    = req.body.email;
                newUser.local.password = newUser.generateHash(req.body.password);
                newUser.local.uname  = req.body.uname ;
                newUser.local.phone = req.body.phone;
                newUser.local.fee = req.body.fee;
                newUser.local.memberSince = req.body.memberSince;
                newUser.local.paid = req.body.paid;
                newUser.local.clearUpto = req.body.clearUpto;
                newUser.local.due = req.body.due;
                newUser.local.donation = req.body.donation;
                newUser.local.status = req.body.status;

                // save the user
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    res.redirect('/admin');
                });
            }

        });    
    });

    app.get('/adminupdate/:email', function(req, res){
            var User = require ('../app/models/user');            
            
            User.findOne({'local.email' : req.params.email}, function(err, user){
                if (err)
                    return done (err);
                
                res.render('adminupdate.ejs', {member: user});
                
            });

    });
    app.post('/adminupdate/:email', function (req, res){

        var User = require ('../app/models/user');
        User.findOne({'local.email' : req.params.email}, function(err, newUser){
                if (err)
                    return done (err);
                // update the user's local credentials
                
                
                newUser.local.uname  = req.body.uname ;
                newUser.local.phone = req.body.phone;
                newUser.local.fee = req.body.fee;
                newUser.local.memberSince = req.body.memberSince;
                newUser.local.paid = req.body.paid;
                newUser.local.clearUpto = req.body.clearUpto;
                newUser.local.due = req.body.due;
                newUser.local.donation = req.body.donation;
                newUser.local.status = req.body.status;

                // save the user 
                newUser.save(function(err) {
                    if (err)
                        throw err;
                 res.redirect('/admin');
                });
    });



        
    });

    app.get('/delete/:email', function (req, res){
        var User = require ('../app/models/user');
        User.findOneAndRemove({'local.email' : req.params.email}, function(err) {
                if (err) throw err;
                res.redirect('/admin');
        });

    });
//===================================
// transaction section
//================================
app.post('/add_t/:email', function (req, res){

    var Transaction = require ('../app/models/transaction');

    //add new transaction
    var newTransaction = new Transaction();

    newTransaction.email = req.params.email;
    newTransaction.amount = req.body.amount;
    newTransaction.type = req.body.type;
    newTransaction.date = req.body.date;
    newTransaction.givento = req.body.givento;
    newTransaction.status = req.body.status;

    // save the user  
                newTransaction.save(function(err) {
                    if (err)
                        throw err;
                 res.redirect('/profile');
                });  
});

app.get('/adminapprove/:email/:date', function(req, res){
            var Transaction = require ('../app/models/transaction'); 
            var User = require ('../app/models/user');
            
            Transaction.findOne({'email' : req.params.email, 'date' : req.params.date}, function(err, transaction){
                if (err)
                    return done (err);
                transaction.status = 'Received';
                transaction.save(function(err){
                    if (err) throw err;

                    User.findOne({'local.email' : req.params.email}, function(err, user)
                        {
                            if (err)
                                return done (err);
                            if(transaction.type === 'fee')
                                     {
                                        user.local.paid += transaction.amount;
                                    }
                            else if(transaction.type === 'donation')
                                     {
                                        user.local.donation += transaction.amount;
                                    }
                            user.save(function (err){
                                if (err)    throw err;
                                res.redirect('/admin');
                            });
                        });

                    
                });
                
                
                
            });

    });

//add transaction by admin
app.post('/admin_add_t', function (req, res){
    var Transaction = require ('../app/models/transaction');
    var User = require ('../app/models/user');

    
    //add new transaction
            var newTransaction = new Transaction();

            newTransaction.email = req.body.email;
            newTransaction.amount = req.body.amount;
            newTransaction.type = req.body.type;
            newTransaction.date = req.body.date;
            newTransaction.givento = req.body.givento;
            newTransaction.status = req.body.status;
        //update user records
        User.findOne({'local.email' : req.body.email}, function(err, user)
                        {
                            if (err)
                                return done (err);
                            if(newTransaction.type === 'fee')
                                     {
                                        user.local.paid += newTransaction.amount;
                                    }
                            else if(newTransaction.type === 'donation')
                                     {
                                        user.local.donation += newTransaction.amount;
                                    }
                            user.save(function (err){
                                if (err)    throw err;
                                
                            });
                        });

    // save the user  
                newTransaction.save(function(err) {
                    if (err)
                        throw err;
                 res.redirect('/admin');
                });  
      
});

//delete a transaction request
app.get('/deletetransaction/:email/:date', function (req, res){
        var Transaction = require ('../app/models/transaction');
        Transaction.findOneAndRemove({'email' : req.params.email, 'date' : req.params.date}, function(err, transaction) {
                if (err) throw err;
                res.redirect('/admin');
        });

    });

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
};



};
ObjectID = require('mongodb').ObjectID;

module.exports = function(app, passport, db) {

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function(req, res) {
    res.render('landing.ejs');
  });

  // PROFILE SECTION =========================
  app.get('/main', isLoggedIn, function(req, res) {
    //bills collection will be used in bills in charge of section, transactions will be owed in the other 3 sections below account info
    const houseId = new ObjectID( req.user.local.house )
    db.collection('House').findOne( {_id: houseId}, (err, house) => {
      if (err) return console.log(err)
      // console.log(`This is the house routes.js:`, houseId, house)
      // console.log('looking for transactions using:', req.user.local.email)
      db.collection('Transactions').find({userFrom: req.user.local.email}).toArray((err, transactions) => {
        if (err) return console.log(err)
        // console.log(`This is the transactions routes.js :`, transactions)
        // console.log(`looking for bills using`, house._id.toString())
        db.collection('Bill').find({house: house._id.toString()}).toArray((err, bills) => {
          if (err) return console.log(err)
          // console.log(`This is the bills routes.js :`, bills)
          res.render('main.ejs', {
            bills: bills,
            transactions: transactions,
            user: req.user,
            house: house
          })
        })
      })
    })
  });

  //HOUSE PROFILE PAGE
  app.get('/house', isLoggedIn, function(req, res) {
    //bills collection will be used in bills in charge of section, transactions will be owed in the other 3 sections below account info
    db.collection('bills').find().toArray((err, bills) => {
      if (err) return console.log(err)
      db.collection('people').find().toArray((err, people) => {
        if (err) return console.log(err)
        db.collection('events').find().toArray((err, events) => {
          if (err) return console.log(err)
          db.collection('houses').find().toArray((err, houses) => {
            if (err) return console.log(err)
            res.render('house.ejs', {bills: bills, people: people, events: events, houses: houses})
          })
        })
      })
    })
  });
  //May add posting option from house page to upload and delete documents in files property of house collection

  //PUBLIC PROFILE PAGE
  app.get('/pubprofile', isLoggedIn, function(req, res) {
    //bills collection will be used in assigned bills, transactions collection will be used in the see transactions, and the people collection is used several times throughout the page
    db.collection('bills').find().toArray((err, bills) => {
      if (err) return console.log(err)
      db.collection('people').find().toArray((err, people) => {
        if (err) return console.log(err)
        db.collection('transactions').find().toArray((err, transactions) => {
          if (err) return console.log(err)
          res.render('house.ejs', {bills: bills, people: people, transactions: transactions, houses: houses})
        })
      })
    })
  });

  //Main portal after logging in

  // LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  // message board routes ===============================================================

  app.post('/messages', (req, res) => {
    db.collection('messages').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/profile')
    })
  })

  app.put('/messages', (req, res) => {
    db.collection('messages')
    .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
      $set: {
        thumbUp:req.body.thumbUp + 1
      }
    }, {
      sort: {_id: -1},
      upsert: true
    }, (err, result) => {
      if (err) return res.send(err)
      res.send(result)
    })
  })

  app.delete('/messages', (req, res) => {
    db.collection('messages').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
      if (err) return res.send(500, err)
      res.send('Message deleted!')
    })
  })

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function(req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/main', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));
  
  // SIGNUP =================================
  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/main', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get('/unlink/local', isLoggedIn, function(req, res) {
    var user            = req.user;
    user.local.email    = undefined;
    user.local.password = undefined;
    user.save(function(err) {
      res.redirect('/profile');
    });
  });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
  return next();

  res.redirect('/');
}

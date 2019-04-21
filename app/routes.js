module.exports = function(app, passport, db, multer, ObjectId) {

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function(req, res) {
    res.render('landing.ejs');
  });

  ///Bill and New Bill pages

  //all bills page
  app.get('/bills', isLoggedIn, function(req, res) {
    //Currently finding all bills. Want to make find all bills in the house the user viewing is in.
    db.collection('bills').find({'houseId': ObjectId(req.user.local.house)}).toArray((err, bills) => {
      if (err) return console.log(err)
      // console.log(`This is the bills get routes.js :`, bills)
      res.render('bills.ejs', {
        bills: bills,
        user: req.user
      })
    })
  })

  app.get('/bill', isLoggedIn, function(req, res) {
    let queryParam = ObjectId(req.query.billId)
    console.log("this is the queryParam variable:",queryParam)
    db.collection('bills').find({_id: queryParam}).toArray((err, bill) => {
      if (err) return console.log(err)
      console.log(`This is the bill get routes.js :`, bill)
      res.render('bill.ejs', {
        bill: bill,
        user: req.user
      })
    })
  })


  //Making a payment from bill page
  app.put('/makePayment', (req, res) => {
    console.log("make payment put route with billId", req.body.billId)
    db.collection('bills')
    .findOneAndUpdate({_id: ObjectId(req.body.billId)}, {
      $set: {
        amountLeft: parseFloat(req.body.amountLeft) - (parseFloat(req.body.amountOriginal)/parseFloat(req.body.numPeople))
      },
      $push: {
        peoplePaid: req.user.local.email
      }
    }, {
      sort: {_id: -1},
      upsert: false
    }, (err, result) => {
      if (err) return res.send(err)
      res.send(result)
    })
  })

  //Creating a new bill
  app.get('/newBill', isLoggedIn, function(req, res) {
    res.render('newBill.ejs', {
      user: req.user
    })
  })

  app.post('/newBill', isLoggedIn, (req, res) => {
    console.log("This is /newbill post req.user", req.user)
    db.collection('bills').save({name: req.body.billName, numPeople: req.body.numPeople, billDesc: req.body.billDesc,  amountOriginal: req.body.billAmount, amountLeft: req.body.billAmount, houseId: ObjectId(req.user.local.house), peoplePaid: [] }, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/bills')
    })
  })

  //page seen when logged in
  app.get('/checkMember', isLoggedIn, function(req, res) {
    console.log("this is the /checkMember filter", req.user.local.house)
    if(req.user.local.house){
      res.redirect('/bills')
    }else{
      res.redirect('/moveIn')
    }
  })

  //page to either create new house or join existing one
  app.get('/moveIn', isLoggedIn, function(req, res) {
    res.render('moveIn.ejs', {
      user: req.user
    })
  })

  app.post('/createHouse', (req, res) => {
    db.collection('houses').insert({
      houseName: req.body.houseName, address: req.body.address, wifi: {wifiName: req.body.wifiName,  wifiPass: req.body.wifiPass}
    }, (err, result) => {
      console.log("this is the /createHouse route", result)
      if (err) return console.log(err)
      console.log("this is the insertedIDs variable from /createHouse route", result.insertedIds["0"])
      db.collection('users').findOneAndUpdate({
        'local.email': req.user.local.email
      }, {
        $set: {
          'local.house': result.insertedIds["0"]
          //can add a .toString() after the bracket if the objectId aspect's giving trouble. Change it to a string and use objectId function to search with it
        }
      }, {
        sort: {_id: -1},
        upsert: false
      }, (err, result) => {
        if (err){
          console.log("this is the /createhouse user update error", err)
          return res.send(err)
        }
        res.redirect('/bills')
      })
    })
  })

  app.post('/joinHouse', (req, res) => {
    //route for when join house form is submitted in moveIn.ejs
    db.collection('users')
    .findOneAndUpdate({
      "local.email": req.user.local.email
    }, {
      $set:{
        "local.house": ObjectId(req.body.houseId)
      }
    }, {
      sort: {_id: -1},
      upsert: false
    }, (err, result) => {
      if (err) return res.send(err)
      res.redirect('/bills')
    })
  })

  // PROFILE SECTION =========================

  //HOUSE PROFILE PAGE


  //PUBLIC PROFILE PAGE


  //Main portal after logging in

  // LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

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
    successRedirect : '/checkMember', // redirect to the secure profile section
    failureRedirect : '/', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  // SIGNUP =================================
  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/moveIn', // redirect to the secure profile section
    failureRedirect : '/', // redirect back to the signup page if there is an error
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

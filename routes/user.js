var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
var userHelpers = require('../helpers/user-helpers');

/* GET user home page. */
router.get('/', function(req, res, next) {
  productHelpers.viewProducts().then((products) => {
    let user = req.session.user;
    res.render('user/products', {products, user});
  })
});

router.get('/login', function(req, res, next) {
  res.render('user/login');
});

router.get('/signup', function(req, res, next) {
   res.render('user/signup');
});

router.post('/signup', function(req, res, next) {
   userHelpers.doSignup(req.body).then((userData) => {
      console.log(userData)
   });
});

router.post('/login', function(req, res, next) {
   userHelpers.doLogin(req.body).then((response) => {
     if(response.status)
     {
       req.session.loggedIn = true;
       req.session.user = response.user;
       res.redirect('/');
     }
     else
     {
       res.redirect('/login');
     }
   });
});

router.get('/logout', function(req, res, next) {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
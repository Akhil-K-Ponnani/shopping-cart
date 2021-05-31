var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
var userHelpers = require('../helpers/user-helpers');

verifyLogin = function(req, res, next) {
  if(req.session.loggedIn)
  {
    next();
  }
  else
  {
    res.redirect('/login');
  }
};

/* GET user home page. */
router.get('/', async function(req, res, next) {
  let user = req.session.user;
  let cartCount = null
  if(req.session.user)
  {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.viewProducts().then((products) => {
    res.render('user/products', {products, user, cartCount});
  })
});

router.get('/login', function(req, res, next) {
  if(req.session.loggedIn)
  {
    res.redirect('/')
  }
  else
    {
      res.render('user/login',{loginErr:req.session.loginErr});
      req.session.loginErr = false;
    }
});

router.get('/signup', function(req, res, next) {
   res.render('user/signup');
});

router.post('/signup', function(req, res, next) {
   userHelpers.doSignup(req.body).then((response) => {
      console.log(response)
      req.session.loggedIn = true;
      req.session.user = response;
      res.redirect('/')
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
       req.session.loginErr = "Invalid Email or Password";
       res.redirect('/login');
     }
   });
});

router.get('/logout', function(req, res, next) {
   req.session.destroy();
   res.redirect('/');
});

router.get('/cart', verifyLogin, async function(req, res, next) {
   let products = await userHelpers.getCartProducts(req.session.user._id)
   let totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
   res.render('user/cart', {products, user:req.session.user, totalAmount});
});

router.get('/add-to-cart/:id', function(req, res, next) {
   userHelpers.addToCart(req.params.id,req.session.user._id).then(() => {
     res.json({status:true})
   })
})

router.post('/change-product-quantity', function(req, res, next) {
   userHelpers.changeProductQuantity(req.body).then(async(response) => {
      response.totalAmount = await userHelpers.getTotalAmount(req.body.user)
      res.json(response)
   })
})

router.post('/remove-cart-product', function(req, res, next) {
   userHelpers.removeCartProduct(req.body).then((response) => {
      res.json(response)
   })
})

router.get('/place-order', verifyLogin, async function(req, res, next) {
   let total = await userHelpers.getTotalAmount(req.session.user._id)
   res.render('user/place-order', {total, user:req.session.user})
})

router.post('/place-order', async function(req, res, next) {
   let products = await userHelpers.getCartProductList(req.body.user)
   let totalPrice = await userHelpers.getTotalAmount(req.body.user)
   userHelpers.placeOrder(req.body, products, totalPrice).then((order) => {
      if(req.body['payment-method']==='COD')
      {
         res.json({codSuccess:true})
      }
      else
      {
         userHelpers.generateRasorpay(order._id, order.totalAmount).then((response) => {
            res.json(response)
         })
      }
   })
})

router.get('/order-success', function(req, res, next) {
   res.render('user/order-success',{user:req.session.user})
})

router.get('/orders', async function(req, res, next) {
   let orders = await userHelpers.getUserOrders(req.session.user._id)
   res.render('user/orders', {user:req.session.user, orders})
})

router.get('/view-order-products/:id', async function(req, res, next) {
   let products = await userHelpers.getOrderProducts(req.params.id)
   res.render('user/view-order-products', {user:req.session.user, products})
})

router.post('/verify-payment', function(req, res, next) {
   console.log(req.body)
})

module.exports = router;
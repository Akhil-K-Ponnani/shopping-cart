var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
var userHelpers = require('../helpers/user-helpers');

verifyLogin = function(req, res, next) {
  if(req.session.userLoggedIn)
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
  productHelpers.viewAllProducts().then((categories) => {
     for(i=0;i<categories.length;i++)
     {
        if(categories[i].products.length === 0)
        {
           delete categories[i]
        }
     }
    res.render('user/products', {categories, user, cartCount});
  })
});

router.get('/login', function(req, res, next) {
  if(req.session.user)
  {
    res.redirect('/');
  }
  else
    {
      res.render('user/login',{loginErr:req.session.userLoginErr});
      req.session.userLoginErr = false;
    }
});

router.get('/signup', function(req, res, next) {
   if(req.session.user)
   {
     res.redirect('/');
   }
   else
   {
     res.render('user/signup',{loginErr:req.session.userLoginErr});
     req.session.userLoginErr = false;
   }
});

router.post('/signup', function(req, res, next) {
   userHelpers.doSignup(req.body).then((response) => {
      if(response.status)
      {
        req.session.user = response.user;
        req.session.userLoggedIn = true;
        res.redirect('/');
      }
      else
      {
        req.session.userLoginErr = "Email already exists. Please login";
        res.redirect('/signup');
      }
   });
});

router.post('/login', function(req, res, next) {
   userHelpers.doLogin(req.body).then((response) => {
     if(response.status)
     {
       req.session.user = response.user;
       req.session.userLoggedIn = true;
       res.redirect('/');
     }
     else
     {
       req.session.userLoginErr = "Invalid Email or Password";
       res.redirect('/login');
     }
   });
});

router.get('/logout', function(req, res, next) {
   req.session.user = null;
   req.session.userLoggedIn = null;
   res.redirect('/');
});

router.get('/cart', verifyLogin, async function(req, res, next) {
   let products = await userHelpers.getCartProducts(req.session.user._id)
   let cartCount = null
   if(req.session.user)
   {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
   }
   let totalAmount = null
   if(products.length>0)
   {
      totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
   }
   res.render('user/cart', {products, user:req.session.user, totalAmount, cartCount});
});

router.get('/add-to-cart/:id', function(req, res, next) {
   userHelpers.addToCart(req.params.id,req.session.user._id).then(() => {
     res.json({status:true})
   })
})

router.post('/change-product-quantity', function(req, res, next) {
   userHelpers.changeProductQuantity(req.body).then(async(response) => {
      response.totalAmount = await userHelpers.getTotalAmount(req.body.user)
      response.cartCount = await userHelpers.getCartCount(req.body.user)
      res.json(response)
   })
})

router.post('/remove-cart-product', function(req, res, next) {
   userHelpers.removeCartProduct(req.body).then((response) => {
      res.json(response)
   })
})

router.get('/place-order', verifyLogin, async function(req, res, next) {
   let total = 0
   if(req.query.product)
   {
      let product = await productHelpers.getProductDetails(req.query.product)
      if(product.stock)
      {
         req.session.userProduct = product
         total = req.session.userProduct.price
      }
   }
   else
   {
      req.session.userProduct = null
      total = await userHelpers.getTotalAmount(req.session.user._id)
   }
   if(total === 0)
      res.redirect('/cart')
   else
      res.render('user/place-order', {total, user:req.session.user})
})

router.post('/place-order', async function(req, res, next) {
   let products = [{}]
   let totalPrice = 0
   if(req.session.userProduct)
   {
      products[0].item = req.session.userProduct._id
      products[0].quantity = 1
      products[0].buyNow = true
      totalPrice = req.session.userProduct.price
   }
   else
   {
      products = await userHelpers.getCartProductList(req.body.user)
      totalPrice = await userHelpers.getTotalAmount(req.body.user)
   }
   userHelpers.placeOrder(req.body, products, totalPrice).then((order) => {
      req.session.userProduct = null
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
   orders.forEach(order => {
      order.product = order.products[0].item
   })
   res.render('user/orders', {user:req.session.user, orders})
})

router.get('/view-order/:id', async function(req, res, next) {
   let order = await userHelpers.getOrderDetails(req.params.id)
   let products = await userHelpers.getOrderProducts(req.params.id)
   res.render('user/view-order', {user:req.session.user, order, products})
})

router.post('/verify-payment', function(req, res, next) {
   userHelpers.verifyPayment(req.body).then(() => {
      userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
         res.json({status:true})
      })
   }).catch((err) => {
      res.json({status:false, errMsg:err})
   })
})

router.get('/view-product/:id', async function(req, res, next) {
   let cartCount = null
   if(req.session.user)
   {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
   }
   productHelpers.getProductDetails(req.params.id).then((product) => {
      res.render('user/view-product', {product, user:req.session.user, cartCount})
   })
})

router.get('/view-category-products/:id', async function(req, res, next) {
   let cartCount = null
   if(req.session.user)
   {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
   }
   productHelpers.viewCategoryProducts(req.params.id).then(async(products) => {
      let category = await productHelpers.getCategoryDetails(req.params.id)
      res.render('user/view-category-products', {products, category, user:req.session.user, cartCount})
   })
})

router.get('/search-product', function(req, res, next) {
   productHelpers.searchProduct(req.query.search).then(async(products) => {
      let productCount = null
      if(products.length > 0)
         productCount = products.length
      let cartCount = null
      if(req.session.user)
      {
         cartCount = await userHelpers.getCartCount(req.session.user._id)
      }
      res.render('user/search-product', {products, user:req.session.user, productCount, cartCount})
   })
})

router.get('/account', function(req, res, next) {
   res.render('user/account')
})

module.exports = router;
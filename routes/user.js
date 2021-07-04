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
  let banners = await productHelpers.viewAllBanners()
  banners[0].active = 'active'
  productHelpers.viewAllProducts().then((categories) => {
     for(i=0;i<categories.length;i++)
     {
        if(categories[i].products.length === 0)
        {
           delete categories[i]
        }
     }
    res.render('user/products', {title:'Home', categories, banners, user, cartCount});
  })
});

router.get('/login', function(req, res, next) {
  if(req.session.user)
  {
    res.redirect('/');
  }
  else
    {
      res.render('user/login',{title:'Login', loginErr:req.session.userLoginErr});
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
     res.render('user/signup',{title:'SignUp', loginErr:req.session.userLoginErr});
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
       req.session.userLoginErr = response.logginErr;
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
   res.render('user/cart', {title:'Cart', products, user:req.session.user, totalAmount, cartCount});
});

router.get('/add-to-cart/:id', function(req, res, next) {
   if(req.session.user)
   {
      userHelpers.addToCart(req.params.id,req.session.user._id).then(() => {
        res.json({status:true})
      })
   }
   else
   {
      res.json({status:false})
   }
})

router.post('/change-product-quantity', function(req, res, next) {
   if(req.session.user)
   {
      userHelpers.changeProductQuantity(req.body).then(async(response) => {
         response.totalAmount = await userHelpers.getTotalAmount(req.body.user)
         response.cartCount = await userHelpers.getCartCount(req.body.user)
         res.json(response)
      })
   }
   else
   {
      res.json({status:false})
   }
})

router.post('/remove-cart-product', function(req, res, next) {
   if(req.session.user)
   {
      userHelpers.removeCartProduct(req.body).then((response) => {
         res.json(response)
      })
   }
   else
   {
      res.json({status:false})
   }
})

router.get('/place-order', verifyLogin, async function(req, res, next) {
   let cartCount = null
   if(req.session.user)
   {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
   }
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
      res.render('user/place-order', {title:'Place Order', total, user:req.session.user, cartCount})
})

router.post('/place-order', async function(req, res, next) {
   if(req.session.user)
   {
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
            res.json({codSuccess:true, status:true})
         }
         else
         {
            userHelpers.generateRasorpay(order._id, order.totalAmount).then((response) => {
               res.json(response)
            })
         }
      })
   }
   else
   {
      res.json({status:false})
   }
})

router.get('/order-success', verifyLogin, async function(req, res, next) {
   let cartCount = null
   if(req.session.user)
   {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
   }
   res.render('user/order-success',{title:'Order Success', user:req.session.user, cartCount})
})

router.get('/orders', verifyLogin, async function(req, res, next) {
   let cartCount = null
   if(req.session.user)
   {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
   }
   let orders = await userHelpers.getUserOrders(req.session.user._id)
   orderCount = null
   if(orders.length > 0)
      orderCount = orders.length
   orders.forEach(order => {
      order.product = order.products[0].item
      order.status.reverse()
      order.currentStatus = order.status[0].name
   })
   res.render('user/orders', {title:'My Orders', user:req.session.user, cartCount, orders, orderCount})
})

router.get('/view-order/:id', verifyLogin, async function(req, res, next) {
   let cartCount = null
   if(req.session.user)
   {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
   }
   let order = await productHelpers.getOrderDetails(req.params.id)
   let products = await productHelpers.getOrderProducts(req.params.id)
   order.status.reverse()
   order.currentStatus = order.status[0].name
   order.currentStatusDate = order.status[0].date.toDateString()+','+order.status[0].date.toLocaleTimeString()
   order.status.forEach(statusDetails => {
      statusDetails.date = statusDetails.date.toDateString()+', '+statusDetails.date.toLocaleTimeString()
   })
   res.render('user/view-order', {title:'View Order', user:req.session.user, cartCount, order, products})
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
      res.render('user/view-product', {title:product.name, product, user:req.session.user, cartCount})
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
      res.render('user/view-category-products', {title:category.name, products, category, user:req.session.user, cartCount})
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
      res.render('user/search-product', {title:'Search Product', products, user:req.session.user, productCount, cartCount})
   })
})

router.get('/account', verifyLogin, async function(req, res, next) {
   let cartCount = null
   if(req.session.user)
   {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
   }
   let user = await userHelpers.getUserDetails(req.session.user._id)
   user.date = user.date.toDateString()
   let orders = await userHelpers.getUserOrders(req.session.user._id)
   let orderCount = {}
   orderCount.total = 0
   orderCount.delivered = 0
   orderCount.toDeliver = 0
   orderCount.cancelled = 0
   let deliveredOrCancelled = false
   orderCount.total = orders.length
   orders.forEach(order => {
      order.status.forEach(statusDetails => {
         if(statusDetails.name == 'Delivered')
         {
            orderCount.delivered++
            deliveredOrCancelled = true
         }
         else if(statusDetails.name == 'Cancelled')
         {
            orderCount.cancelled++
            deliveredOrCancelled = true
         }
      })
      if(deliveredOrCancelled == false)
      {
         orderCount.toDeliver++
      }
      else
      {
         deliveredOrCancelled = false
      }
   })
   deliveredOrCancelled = null
   let orderCountPercent = {}
   orderCountPercent.total = 0
   orderCountPercent.delivered = 0
   orderCountPercent.toDeliver = 0
   orderCountPercent.cancelled = 0
   if(orderCount.total > 0)
   {
      orderCountPercent.total = (orderCount.total/orderCount.total)*100
      orderCountPercent.delivered = (orderCount.delivered/orderCount.total)*100
      orderCountPercent.toDeliver = (orderCount.toDeliver/orderCount.total)*100
      orderCountPercent.cancelled = (orderCount.cancelled/orderCount.total)*100
   }
   res.render('user/account', {title:'My Account', user, cartCount, orderCount, orderCountPercent})
})

router.get('/edit-account', verifyLogin, async function(req, res, next) {
   let cartCount = null
   if(req.session.user)
   {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
   }
   res.render('user/edit-account', {title:'Edit Profile', user:req.session.user, cartCount})
})

router.post('/edit-account', verifyLogin, function(req, res, next) {
   userHelpers.updateAccount(req.body, req.session.user._id).then(async(response) => {
      req.session.user = await userHelpers.getUserDetails(req.session.user._id)
      res.redirect('/account')
   })
})

router.get('/about', async function(req, res, next) {
   let cartCount = null
   if(req.session.user)
   {
      cartCount = await userHelpers.getCartCount(req.session.user._id)
   }
   res.render('user/about', {title:'About Us', user:req.session.user, cartCount})
})

module.exports = router;
var express = require('express');
var fs = require('fs');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')

verifyLogin = function(req, res, next) {
   if(req.session.adminLoggedIn)
   {
      next()
   }
   else
   {
      res.redirect('/admin/login');
   }
};

verifySuper = function(req, res, next) {
   if(req.session.admin.super)
   {
      next()
   }
   else
   {
      res.redirect('/admin');
   }
};

/* GET admin home listing. */
router.get('/',verifyLogin, function(req, res, next) {
  productHelpers.viewAllProducts().then((categories) => {
    let slno = 1
    categories.forEach(category => {
       category.products.forEach(product => {
          product.slno = slno
          slno++
       })
    })
    slno = null
    res.render('admin/products', {title:'All Products', categories, productSearch:true, admin:req.session.admin});
  })
});

router.get('/login', function(req, res, next) {
   if(req.session.admin)
   {
      res.redirect('/admin');
   }
   else
   {
      res.render('admin/login', {title:'Login', loginErr:req.session.adminLoginErr, admin:true});
      req.session.adminLoginErr = false;
   }
});

router.post('/login', function(req, res, next) {
   productHelpers.doLogin(req.body).then((response) => {
      if(response.status)
      {
         req.session.admin = response.admin;
         req.session.adminLoggedIn = true;
         res.redirect('/admin');
      }
      else
      {
         req.session.adminLoginErr = response.logginErr;
         res.redirect('/admin/login');
      }
   })
});

router.get('/logout', function(req, res, next) {
   req.session.admin = null;
   req.session.adminLoggedIn = null;
   res.redirect('/admin/login');
})

router.get('/add-product', verifyLogin, function (req, res, next) {
  productHelpers.viewAllCategories().then((categories) => {
    res.render('admin/add-product', {title:'Add Product', categories, productSearch:true, admin:req.session.admin});
  })
});

router.post('/add-product', verifyLogin, function(req, res, next) {
  productHelpers.addProduct(req.body, function(id) {
    let image = req.files.image;
    image.mv('./public/product-images/'+id+'.jpg', function(err, done) {
      if(!err)
        res.redirect('/admin');
      else
        console.log(err);
    });
  });
});

router.get('/delete-product/:id', verifyLogin, function(req, res, next) {
  productId = req.params.id
  productHelpers.deleteProduct(productId).then((response) => {
    fs.unlink('./public/product-images/'+productId+'.jpg', function(err) {
       if(err)
         console.log(err)
       res.redirect('/admin');
    })
  })
});

router.get('/edit-product/:id', verifyLogin, async function(req, res, next) {
  let product = await productHelpers.getProductDetails(req.params.id)
  let categories = await productHelpers.viewAllCategories()
  product.date = product.date.toDateString()+', '+product.date.toLocaleTimeString()
  categories.forEach(category => {
     if(category._id.toString() === product.category.toString())
     {
        category['selected'] = true
     }
  })
  res.render('admin/edit-product', {title:'Edit Product', product, categories, productSearch:true, admin:req.session.admin});
});

router.post('/edit-product/:id', verifyLogin, function(req, res, next) {
  let id = req.params.id;
  productHelpers.updateProduct(req.params.id, req.body).then(() =>{
    res.redirect('/admin')
    if(req.files.image)
    {
      let image = req.files.image;
      image.mv('./public/product-images/'+id+'.jpg');
    }
  })
})

router.get('/orders',verifyLogin, function(req, res, next) {
  productHelpers.viewOrders().then((orders) => {
    let slno = 1
    orders.forEach(order => {
       order.slno = slno
       order.currentStatus = order.status[order.status.length-1].name
       if(order.currentStatus == 'Delivered')
          order.Delivered = true
       else if(order.currentStatus == 'Cancelled')
          order.Cancelled = true
       order.currentStatusDate = order.status[order.status.length-1].date.toDateString()+', '+order.status[order.status.length-1].date.toLocaleTimeString()
       slno++
    })
    slno = null
    res.render('admin/orders', {title:'All Orders', orders, orderSearch:true, admin:req.session.admin});
  })
});

router.get('/view-order/:id', verifyLogin, async function(req, res, next) {
   let order = await productHelpers.getOrderDetails(req.params.id)
   let products = await productHelpers.getOrderProducts(req.params.id)
   order.status.reverse()
   order.currentStatus = order.status[0].name
   order[order.status[0].name.replace(/ /g,'')] = true
   order.status.forEach(statusDetails => {
      statusDetails.date = statusDetails.date.toDateString()+', '+statusDetails.date.toLocaleTimeString()
   })
   res.render('admin/view-order', {title:'View Order', order, products, admin:req.session.admin})
})

router.post('/update-order-status', verifyLogin, function(req, res, next) {
   productHelpers.updateOrderStatus(req.body.orderId, req.body.status).then((response) => {
      res.json(response)
   })
})

router.get('/users',verifyLogin, function(req, res, next) {
  userHelpers.viewAllUsers().then((users) => {
    let slno = 1
    users.forEach(user => {
       user.slno = slno
       slno++
    })
    slno = null
    res.render('admin/users', {title:'All Users', users, userSearch:true, admin:req.session.admin});
  })
});

router.get('/view-user/:id', verifyLogin, async function(req, res, next) {
   let user = await userHelpers.getUserDetails(req.params.id)
   let orders = await userHelpers.getUserOrders(req.params.id)
   user.date = user.date.toDateString()+', '+user.date.toLocaleTimeString()
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
   orderCountPercent.total = '0.0'
   orderCountPercent.delivered = '0.0'
   orderCountPercent.toDeliver = '0.0'
   orderCountPercent.cancelled = '0.0'
   if(orderCount.total > 0)
   {
      orderCountPercent.total = ((orderCount.total/orderCount.total)*100).toFixed(1)
      orderCountPercent.delivered = ((orderCount.delivered/orderCount.total)*100).toFixed(1)
      orderCountPercent.toDeliver = ((orderCount.toDeliver/orderCount.total)*100).toFixed(1)
      orderCountPercent.cancelled = ((orderCount.cancelled/orderCount.total)*100).toFixed(1)
   }
   res.render('admin/view-user', {title:'View User', user, orderCount, orderCountPercent, admin:req.session.admin})
})

router.post('/change-user-status', verifyLogin, function(req, res, next) {
   userHelpers.changeUserStatus(req.body.userId, req.body.status).then((response) => {
      res.json(response)
   })
})

router.get('/delete-user/:id', verifyLogin, function(req, res, next) {
   userHelpers.deleteUser(req.params.id).then((response) => {
      res.redirect('/admin/users')
   })
})

router.get('/admins', verifyLogin, verifySuper, function(req, res, next) {
   userHelpers.viewAllAdmins().then((admins) => {
     let slno = 1
     admins.forEach(admin => {
        admin.slno = slno
        slno++
     })
     slno = null
     res.render('admin/admins', {title:'All Admins', admins, adminSearch:true, admin:req.session.admin});
   })
})

router.get('/add-admin', verifyLogin, verifySuper, function(req, res, next) {
   res.render('admin/add-admin', {title:'Add Admin', adminSearch:true, addAdminErr:req.session.addAdminErr, admin:req.session.admin})
   req.session.addAdminErr = false
});

router.post('/add-admin', verifyLogin, verifySuper, function(req, res, next) {
   userHelpers.addAdmin(req.body).then((response) => {
      if(response.status)
      {
         res.redirect('/admin/admins');
      }
      else
      {
         req.session.addAdminErr = "Admin Already Exists"
         res.redirect('/admin/add-admin')
      }
   })
});

router.get('/view-admin/:id', verifyLogin, verifySuper, async function(req, res, next) {
   let adminData = await userHelpers.getAdminDetails(req.params.id)
   adminData.date = adminData.date.toDateString()+', '+adminData.date.toLocaleTimeString()
   res.render('admin/view-admin', {title:'View Admin', adminData, adminSearch:true, admin:req.session.admin})
});

router.post('/change-admin-status', verifyLogin, verifySuper, function(req, res, next) {
   userHelpers.changeAdminStatus(req.body.adminId, req.body.status).then((response) => {
      res.json(response)
   })
})

router.post('/change-admin-position', verifyLogin, verifySuper, function(req, res, next) {
   userHelpers.changeAdminPosition(req.body.adminId, req.body.position).then((response) => {
      res.json(response)
   })
})

router.get('/delete-admin/:id', verifyLogin, verifySuper, function(req, res, next) {
   userHelpers.deleteAdmin(req.params.id).then((response) => {
      res.redirect('/admin/admins')
   })
})

router.get('/categories', verifyLogin, function(req, res, next) {
   productHelpers.viewAllCategories().then((categories) => {
      let slno = 1
      categories.forEach(category => {
         category.slno = slno
         slno++
      })
      slno = null
      res.render('admin/categories', {title:'All Categories', categories, categorySearch:true, admin:req.session.admin})
   })
});

router.get('/add-category', verifyLogin, function(req, res, next) {
   res.render('admin/add-category', {title:'Add Category', categorySearch:true, admin:req.session.admin})
});

router.post('/add-category', verifyLogin, function(req, res, next) {
   productHelpers.addCategory(req.body).then((id) => {
      let image = req.files.image
      image.mv('./public/category-images/'+id+'.jpg', function(err, done) {
      if(!err)
        res.redirect('/admin/categories');
      else
        console.log(err);
     })
   })
});

router.get('/edit-category/:id', verifyLogin, async function(req, res, next) {
   let category = await productHelpers.getCategoryDetails(req.params.id)
   category.date = category.date.toDateString()+', '+category.date.toLocaleTimeString()
   res.render('admin/edit-category', {title:'Edit Category', category, categorySearch:true, admin:req.session.admin})
});

router.post('/edit-category/:id', verifyLogin, function(req, res, next) {
  let id = req.params.id;
  productHelpers.updateCategory(req.params.id, req.body).then(() =>{
    res.redirect('/admin/categories')
    if(req.files.image)
    {
      let image = req.files.image;
      image.mv('./public/category-images/'+id+'.jpg');
    }
  })
});

router.get('/delete-category/:id', verifyLogin, function(req, res, next) {
   categoryId = req.params.id
   productHelpers.deleteCategory(categoryId).then((response) => {
      fs.unlink('./public/category-images/'+categoryId+'.jpg', function(err) {
         if(err)
           console.log(err)
      res.redirect('/admin/categories')
      })
   })
});

router.get('/banners', verifyLogin, function(req, res, next) {
   productHelpers.viewAllBanners().then((banners) => {
      let slno = 1
      banners.forEach(banner => {
         banner.slno = slno
         slno++
      })
      slno = null
      res.render('admin/banners', {title:'All Banners', banners, bannerSearch:true, admin:req.session.admin})
   })
});

router.get('/add-banner', verifyLogin, function(req, res, next) {
   res.render('admin/add-banner', {title:'Add Banner', bannerSearch:true, admin:req.session.admin})
});

router.post('/add-banner', verifyLogin, function(req, res, next) {
   productHelpers.addBanner(req.body).then((id) => {
      let image = req.files.image
      image.mv('./public/banner-images/'+id+'.jpg', function(err, done) {
      if(!err)
        res.redirect('/admin/banners');
      else
        console.log(err);
     })
   })
});

router.get('/edit-banner/:id', verifyLogin, async function(req, res, next) {
   let banner = await productHelpers.getBannerDetails(req.params.id)
   banner.date = banner.date.toDateString()+', '+banner.date.toLocaleTimeString()
   res.render('admin/edit-banner', {title:'Edit Banner', banner, bannerSearch:true, admin:req.session.admin})
});

router.post('/edit-banner/:id', verifyLogin, function(req, res, next) {
  let id = req.params.id;
  productHelpers.updateBanner(req.params.id, req.body).then(() =>{
    res.redirect('/admin/banners')
    if(req.files.image)
    {
      let image = req.files.image;
      image.mv('./public/banner-images/'+id+'.jpg');
    }
  })
});

router.get('/delete-banner/:id', verifyLogin, function(req, res, next) {
   bannerId = req.params.id
   productHelpers.deleteBanner(bannerId).then((response) => {
      fs.unlink('./public/banner-images/'+bannerId+'.jpg', function(err) {
         if(err)
           console.log(err)
      res.redirect('/admin/banners')
      })
   })
});

router.get('/search-product', verifyLogin, function(req, res, next) {
   productHelpers.searchProduct(req.query.search).then((products) => {
      let productCount = null
      if(products.length > 0)
         productCount = products.length
      let slno = 1
      products.forEach(product => {
         product.slno = slno
         slno++
      })
      slno = null
      res.render('admin/search-product', {title:'Search Product', products, productSearch:true, productCount, admin:req.session.admin})
   })
})

router.get('/search-category', verifyLogin, function(req, res, next) {
   productHelpers.searchCategory(req.query.search).then((categories) => {
      let categoryCount = null
      if(categories.length > 0)
         categoryCount = categories.length
      let slno = 1
      categories.forEach(category => {
         category.slno = slno
         slno++
      })
      slno = null
      res.render('admin/search-category', {title:'Search Category', categories, categorySearch:true, categoryCount, admin:req.session.admin})
   })
})

router.get('/search-banner', verifyLogin, function(req, res, next) {
   productHelpers.searchBanner(req.query.search).then((banners) => {
      let bannerCount = null
      if(banners.length > 0)
         bannerCount = banners.length
      let slno = 1
      banners.forEach(banner => {
         banner.slno = slno
         slno++
      })
      slno = null
      res.render('admin/search-banner', {title:'Search Banner', banners, bannerSearch:true, bannerCount, admin:req.session.admin})
   })
})

router.get('/search-order', verifyLogin, function(req, res, next) {
   productHelpers.searchOrder(req.query.search).then((orders) => {
      let orderCount = null
      if(orders.length > 0)
         orderCount = orders.length
      let slno = 1
      orders.forEach(order => {
         order.slno = slno
         order.currentStatus = order.status[order.status.length-1].name
         if(order.currentStatus == 'Delivered')
            order.Delivered = true
         else if(order.currentStatus == 'Cancelled')
            order.Cancelled = true
         order.currentStatusDate = order.status[order.status.length-1].date.toDateString()+', '+order.status[order.status.length-1].date.toLocaleTimeString()
         slno++
      })
      slno = null
      res.render('admin/search-order', {title:'Search Order', orders, orderSearch:true, orderCount, admin:req.session.admin})
   })
})

router.get('/search-user', verifyLogin, function(req, res, next) {
   userHelpers.searchUser(req.query.search).then((users) => {
      let userCount = null
      if(users.length > 0)
         userCount = users.length
      let slno = 1
      users.forEach(user => {
         user.slno = slno
         slno++
      })
      slno = null
      res.render('admin/search-user', {title:'Search User', users, userSearch:true, userCount, admin:req.session.admin})
   })
})

router.get('/search-admin', verifyLogin, verifySuper, function(req, res, next) {
   userHelpers.searchAdmin(req.query.search).then((admins) => {
      let adminCount = null
      if(admins.length > 0)
         adminCount = admins.length
      let slno = 1
      admins.forEach(admin => {
         admin.slno = slno
         slno++
      })
      slno = null
      res.render('admin/search-admin', {title:'Search Admin', admins, adminSearch:true, adminCount, admin:req.session.admin})
   })
})

module.exports = router;
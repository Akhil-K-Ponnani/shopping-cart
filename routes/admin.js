var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')

/* GET admin home listing. */
router.get('/', function(req, res, next) {
  productHelpers.viewProducts().then((products) => {
    res.render('admin/products', {products, admin:true});
  })
});

router.get('/add-product', function (req, res, next) {
  res.render('admin/add-product', {admin:true});
});

router.post('/add-product', function(req, res, next) {
  productHelpers.addProduct(req.body, function(id) {
    let image = req.files.image;
    image.mv('./public/product-images/'+id+'.jpg', function(err, done) {
      if(!err)
        res.render('admin/add-product');
      else
        console.log(err)
    });
  });
});

router.get('/delete-product/:id', function(req, res, next) {
  productId = req.params.id
  productHelpers.deleteProduct(productId).then((response) => {
    res.redirect('/admin')
  })
});

module.exports = router;
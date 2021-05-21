var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')

/* GET user home page. */
router.get('/', function(req, res, next) {
  productHelpers.viewProducts().then((products) => {
    res.render('user/products', { products, admin:false});
  })
});

module.exports = router;
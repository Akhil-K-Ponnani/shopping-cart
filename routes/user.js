var express = require('express');
var router = express.Router();

/* GET user home page. */
router.get('/', function(req, res, next) {
  let products=[
  {
    name:"Apple iPhone 12 Pro Max", 
    category:"Mobile", 
    description:"iPhone 12 Pro Max. Larger 6.7-inch (17 cm diagonal) Super Retina XDR display.", 
    image:"https://images-na.ssl-images-amazon.com/images/I/41N9-hbLe0L._AC_SY580_FMwebp_.jpg"
  }, 
  {
  name:"Realme 8 Pro", 
  category:"Mobile", 
  description:"realme 8 Pro in India, 108MP Ultra Quad Camera, 50W SuperDart Charge, 16.3cm (6.43) Super AMOLED fullscreen.", 
  image:"https://rukminim1.flixcart.com/image/750/750/knrsjgw0/mobile/s/b/z/8-pro-rmx3081-realme-original-imag2dcabdfyjrtb.jpeg?q=20"
  }, 
  {
  name:"Redmi Note 10 Pro Max", 
  category:"Mobile", 
  description:"Qualcomm Snapdragon 732G with Kryo 470 Octa-core; 8nm process; Up to 2.3GHz clock speed", 
  image:"https://images-na.ssl-images-amazon.com/images/I/41cOC6T38iS._AC_SY580_FMwebp_.jpg"
  }, 
  {
  name:"OnePlus 9 Pro 5G", 
  category:"Mobile", 
  description:"Rear Quad Camera Co-Developed by Hasselblad, 48 MP Main camera, 50 MP Ultra Wide Angle Camera with Sensor size of 1/1.56'', 8 MP Telepoto Lens, 2 MP Monochorme Lens,16 MP Front Camera", 
  image:"https://images-na.ssl-images-amazon.com/images/I/41KqaHvwcpL._AC_SY580_FMwebp_.jpg"
  }]
  res.render('index', { products, admin:false});
});

module.exports = router;
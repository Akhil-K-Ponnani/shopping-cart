var bcrypt = require('bcryptjs');
var objectId = require('mongodb').ObjectID;
var db = require('../config/connection');
var collections = require('../config/collections');

module.exports = {
  addProduct:function(product, callback) {
    product.price = parseInt(product.price)
    db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product).then(function(data) {
      callback(data.ops[0]._id);
    })
  },
  doLogin:function(adminData) {
    return new Promise(async(resolve, reject) => {
      loginStatus = false;
      response = {}
      let admin = await db.get().collection(collections.ADMIN_COLLECTION).findOne({email:adminData.email})
      if(admin)
      {
        bcrypt.compare(adminData.password, admin.password).then((status) => {
          if(status)
          {
             response.admin = admin
             response.status = true
             resolve(response)
          }
          else
          {
             resolve({status:false})
          }
        })
      }
      else
      {
         resolve({status:false})
      }
    })
  }, 
/* viewAllProducts:function() {
    return new Promise(async(resolve, reject) => {
      let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray();
      resolve(products);
    })*/
    viewAllProducts:function() {
    return new Promise(async(resolve, reject) => {
       let categories = await db.get().collection(collections.CATEGORY_COLLECTION).aggregate([
          {
             $lookup:
             {
                from:collections.PRODUCT_COLLECTION,
                localField:'name', 
                foreignField:'category',
                as:'products'
             }
          },
       ]).toArray()
    resolve(categories);
    })
  },
  deleteProduct:function(productId) {
    return new Promise((resolve, reject) => {
      db.get().collection(collections.PRODUCT_COLLECTION).removeOne({_id:objectId(productId)}).then((response) => {
        resolve(response)
      })
    })
  },
  getProductDetails:function(productId) {
    return new Promise((resolve, reject) => {
      db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:objectId(productId)}).then((product) => {
        resolve(product)
      })
    })
  },
  updateProduct:function(productId, productDetails) {
    return new Promise((resolve, reject) => {
      productDetails.price = parseInt(productDetails.price)
      db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:objectId(productId)}, 
      {$set:
      {
        name:productDetails.name,
        category:productDetails.category,
        description:productDetails.description,
        price:productDetails.price
      }}).then((response) => {
        resolve(response)
      })
    })
  },
  viewOrders:function() {
    return new Promise(async(resolve, reject) => {
      let orders = await db.get().collection(collections.ORDER_COLLECTION).find().toArray();
      resolve(orders);
    })
  },
  viewUsers:function() {
    return new Promise(async(resolve, reject) => {
      let users = await db.get().collection(collections.USER_COLLECTION).find().toArray();
      resolve(users);
    })
  },
  addCategory:function(category) {
     return new Promise((resolve, reject) => {
        db.get().collection(collections.CATEGORY_COLLECTION).insertOne(category).then((data) => {
           resolve(data.ops[0])
        })
     })
  },
  viewAllCategories:function() {
     return new Promise((resolve, reject) => {
        
     })
  }
};
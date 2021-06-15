var bcrypt = require('bcryptjs');
var objectId = require('mongodb').ObjectID;
var db = require('../config/connection');
var collections = require('../config/collections');

module.exports = {
  addProduct:function(product, callback) {
    product.price = parseInt(product.price)
    product.category = objectId(product.category)
    if(product.stock)
       product.stock = true
    else
       product.stock = false
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
                localField:'_id', 
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
      productDetails.category = objectId(productDetails.category)
      if(productDetails.stock)
         productDetails.stock = true
      else
         productDetails.stock = false
      db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:objectId(productId)}, 
      {$set:
      {
        name:productDetails.name,
        variant:productDetails.variant,
        category:productDetails.category,
        price:productDetails.price,
        description:productDetails.description,
        stock:productDetails.stock
      }}).then((response) => {
         if(productDetails.stock === false)
            db.get().collection(collections.CART_COLLECTION).updateMany({'products.item':objectId(productId)},
            {
               $pull:{products:{item:objectId(productId)}}
            })
        resolve(response)
      })
    })
  },
  viewOrders:function() {
    return new Promise(async(resolve, reject) => {
      let orders = await db.get().collection(collections.ORDER_COLLECTION).find().sort({_id:-1}).toArray();
      resolve(orders);
    })
  },
  getOrderDetails:function(orderId) {
     return new Promise(async(resolve, reject) => {
        let order = await db.get().collection(collections.ORDER_COLLECTION).findOne({_id:objectId(orderId)})
        resolve(order)
     })
  },
  getOrderProducts:function(orderId) {
     return new Promise(async(resolve, reject) => {
        let orderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
           {
              $match:{_id:objectId(orderId)}
           },
           {
              $unwind:'$products',
           },
           {
              $project:
              {
                 item:'$products.item',
                 quantity:'$products.quantity'
              }
           },
           {
              $lookup:
              {
                 from:collections.PRODUCT_COLLECTION,
                 localField:'item',
                 foreignField:'_id',
                 as:'product'
              }
           },
           {
              $project:
              {
                 item:1, quantity:1, product:{$arrayElemAt:['$product', 0]}
              }
           }
        ]).toArray()
        resolve(orderItems)
     })
  },
  updateOrderStatus:function(orderId, status) {
     return new Promise(async(resolve, reject) => {
        let order = await db.get().collection(collections.ORDER_COLLECTION).findOne({_id:objectId(orderId)})
        let statusExist = order.status.findIndex(statusDetails => statusDetails.name == status)
        if(statusExist===-1)
        {
           statusObj = {name:status, date:new Date()}
           db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
           {
              $push:{status:statusObj}
           }).then((response) => {
              response.status = true
              resolve(response)
           })
        }
        else
           resolve({status:false})
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
           resolve(data.ops[0]._id)
        })
     })
  },
  viewAllCategories:function() {
     return new Promise(async(resolve, reject) => {
        let categories = await db.get().collection(collections.CATEGORY_COLLECTION).find().toArray()
        resolve(categories)
     })
  },
  getCategoryDetails:function(categoryId) {
     return new Promise((resolve, reject) => {
        db.get().collection(collections.CATEGORY_COLLECTION).findOne({_id:objectId(categoryId)}).then((category) => {
           resolve(category)
        })
     })
  },
  updateCategory:function(categoryId, categoryDetails) {
    return new Promise((resolve, reject) => {
      db.get().collection(collections.CATEGORY_COLLECTION).updateOne({_id:objectId(categoryId)}, 
      {$set:
      {
        name:categoryDetails.name,
        displayName:categoryDetails.displayName
      }}).then((response) => {
        resolve(response)
      })
    })
  },
  deleteCategory:function(categoryId) {
     return new Promise((resolve, reject) => {
        db.get().collection(collections.CATEGORY_COLLECTION).removeOne({_id:objectId(categoryId)}).then((response) => {
        db.get().collection(collections.PRODUCT_COLLECTION).removeMany({category:objectId(categoryId)})
           resolve(response)
        })
     })
  },
  viewCategoryProducts:function(categoryId) {
     return new Promise(async(resolve, reject) => {
        let products = await db.get().collection(collections.PRODUCT_COLLECTION).find({category:objectId(categoryId)}).toArray()
        resolve(products)
     })
  },
  searchProduct:function(search) {
     return new Promise(async(resolve, reject) => {
        let searchResult = await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
           {
              $lookup:
              {
                 from:collections.CATEGORY_COLLECTION,
                 localField:'category', 
                 foreignField:'_id',
                 as:'category'
              }
           },
           {
              $project:
              {
                 name:1, category:{$arrayElemAt:['$category',0]}, variant:1, price:1, description:1, stock:1
              }
           },
           {
              $project:
              {
                 name:1, category:'$category.name', variant:1, price:1, description:1, stock:1
              }
           },
           {
              $match:
              {
                 $or:[
                    {name:{'$regex' : search, '$options' : 'i'}},
                    {category:{'$regex' : search, '$options' : 'i'}},
                    {variant:{'$regex' : search, '$options' : 'i'}}
                 ]
              }
           }
        ]).toArray()
        resolve(searchResult)
     })
  },
  searchCategory:function(search) {
     return new Promise(async(resolve, reject) => {
        let searchResult = await db.get().collection(collections.CATEGORY_COLLECTION).find({$or:[{name:{'$regex' : search, '$options' : 'i'}}, {displayName:{'$regex' : search, '$options' : 'i'}}]}).toArray()
        resolve(searchResult)
     })
  },
  searchOrder:function(search) {
     return new Promise(async(resolve, reject) => {
        let searchResult = await db.get().collection(collections.ORDER_COLLECTION).find({$or:[
           {'deliveryDetails.name':{'$regex' : search, '$options' : 'i'}}, {'deliveryDetails.mobile':{'$regex' : search, '$options' : 'i'}}, {'deliveryDetails.address':{'$regex' : search, '$options' : 'i'}}, {'deliveryDetails.pincode':{'$regex' : search, '$options' : 'i'}}, {paymentMethod:{'$regex' : search, '$options' : 'i'}}, {status:{'$regex' : search, '$options' : 'i'}}
        ]}).toArray()
        resolve(searchResult)
     })
  },
  searchUser:function(search) {
     return new Promise(async(resolve, reject) => {
        let searchResult = await db.get().collection(collections.USER_COLLECTION).find({$or:[{name:{'$regex' : search, '$options' : 'i'}}, {email:{'$regex' : search, '$options' : 'i'}}, {status:{'$regex' : search, '$options' : 'i'}}]}).toArray()
        resolve(searchResult)
     })
  }
};
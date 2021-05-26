var bcrypt = require('bcryptjs');
var objectId = require('mongodb').ObjectID;
var db = require('../config/connection');
var collections = require('../config/collections');

module.exports = {
   doSignup:function(userData) {
      return new Promise(async(resolve, reject) => {
         userData.password = await bcrypt.hash(userData.password, 10);
         db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {
         resolve(data.ops[0]);
         });
      });
   },
   doLogin:function(userData) {
      return new Promise(async(resolve, reject) => {
        let loginSataus = false;
        response = {}
        let user = await db.get().collection(collections.USER_COLLECTION).findOne({email:userData.email});
        if(user)
        {
          bcrypt.compare(userData.password, user.password).then((status) => {
            if(status)
            {
               response.user = user
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
  addToCart:function(productId, userId) {
     let productObj = {item:objectId(productId), quantity:1}
     return new Promise(async(resolve, reject) => {
        let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)});
        if(userCart)
        {
           let productExist = userCart.products.findIndex(product => product.item==productId)
           if(productExist!=-1)
           {
              db.get().collection(collections.CART_COLLECTION).updateOne({'products.item':objectId(productId)}, 
              {$inc:{'products.$.quantity':1}})
              resolve()
           }
           else
           {
           db.get().collection(collections.CART_COLLECTION).updateOne({user:objectId(userId)},
              {
                 $push:{products:productObj}
              }).then((response) => {
                 resolve(response)
              })
            }
        }
        else
        {
           cartObj = {
             user:objectId(userId),
             products:[productObj]
           }
           db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response) => {
              resolve(response)
           })
        }
     })
  },
  getCartProducts:function(userId) {
     return new Promise(async(resolve, reject) => {
        let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
           {
              $match:{user:objectId(userId)}
           }, 
           {
              $unwind:'$products'
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
           }
        /*   {
              $lookup:
              {
                 from:collections.PRODUCT_COLLECTION, 
                 let:{productList:'$products'},
                 pipeline:
                 [
                    {
                       $match:
                       {
                          $expr:
                          {
                             $in:['$_id', '$$productList']
                          }
                       }
                    }
                 ],
                 as:'cartItems'
              }
           }*/
        ]).toArray()
        resolve(cartItems)
     })
  },
  getCartCount:function(userId) {
     return new Promise(async(resolve, reject) => {
        count = 0
        let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart)
        {
           count = cart.products.length
        }
        resolve(count)
     })
  }
}
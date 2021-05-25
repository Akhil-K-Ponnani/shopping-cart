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
     return new Promise(async(resolve, reject) => {
        let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)});
        if(userCart)
        {
           db.get().collection(collections.CART_COLLECTION).updateOne({user:objectId(userId)},
              {
                 $push:{products:objectId(productId)}
              }).then((response) => {
                 resolve(response)
              })
        }
        else
        {
           cartObj = {
             user:objectId(userId),
             products:[objectId(productId)]
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
           }
        ]).toArray()
        resolve(cartItems[0].cartItems)
     })
  }
}
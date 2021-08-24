var bcrypt = require('bcrypt');
var Razorpay = require('razorpay');
var objectId = require('mongodb').ObjectID;
var db = require('../config/connection');
var collections = require('../config/collections');

var instance = new Razorpay({
  key_id: 'rzp_test_o4TqEFcczJ1VzH',
  key_secret: 'uOzWvQVVODrUw6cBw5FnCVg6',
});

module.exports = {
   doSignup:function(userData) {
      return new Promise(async(resolve, reject) => {
         userData.date = new Date()
         userData.active = true
         response = {}
         let user = await db.get().collection(collections.USER_COLLECTION).findOne({email:userData.email});
         if(user)
         {
           resolve({status:false})
         }
         else
         {
           userData.password = await bcrypt.hash(userData.password, 10);
           db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {
             response.user = data.ops[0]
             response.status = true
             resolve(response);
           });
         }
      });
   },
   doLogin:function(userData) {
      return new Promise(async(resolve, reject) => {
        let loginStatus = false;
        response = {}
        let user = await db.get().collection(collections.USER_COLLECTION).findOne({email:userData.email});
        if(user)
        {
          bcrypt.compare(userData.password, user.password).then((status) => {
            if(status)
            {
               if(user.active)
               {
                 response.user = user
                 response.status = true
                 resolve(response)
               }
               else
               {
                 response.logginErr = "This account was Blocked. Please contact Admin"
                 response.status = false
                 resolve(response)
               }
            }
            else
            {
              response.logginErr = "Invalid Email or Password"
              response.status = false
              resolve(response)
            }
          })
        }
        else
        {
          response.logginErr = "Invalid Email or Password"
          response.status = false
          resolve(response)
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
              db.get().collection(collections.CART_COLLECTION).updateOne({user:objectId(userId), 'products.item':objectId(productId)}, 
              {
                 $inc:{'products.$.quantity':1}
              }).then(() => {
                 resolve()
              })
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
           },
           {
              $project:{item:1, quantity:1, product:{$arrayElemAt:['$product',0]}}
           }
        ]).toArray()
        resolve(cartItems)
     })
  },
  getCartCount:function(userId) {
     return new Promise(async(resolve, reject) => {
        let count = 0
        let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart)
        {
           for(i=0;i<cart.products.length;i++)
           {
              count = count + cart.products[i].quantity
           }
        }
        resolve(count)
     })
  },
  changeProductQuantity:function(details)
  {
     details.count = parseInt(details.count)
     return new Promise((resolve, reject) => {
        if(details.count==-1 && details.quantity==1)
        {
           db.get().collection(collections.CART_COLLECTION).updateOne({_id:objectId(details.cart)}, 
           {
              $pull:{products:{item:objectId(details.product)}}
           }).then((response) => {
              resolve({status:true, removeProduct:true})
           })
        }
        else
        {
           db.get().collection(collections.CART_COLLECTION).updateOne({_id:objectId(details.cart), 'products.item':objectId(details.product)},
           {
              $inc:{'products.$.quantity':details.count}
           }).then((response) => {
              resolve({status:true})
           })
        }
     })
  },
  removeCartProduct:function(details) {
     return new Promise((resolve, reject) => {
        db.get().collection(collections.CART_COLLECTION).updateOne({_id:objectId(details.cart)}, 
        {
           $pull:{products:{item:objectId(details.product)}}
        }).then((response) => {
           resolve({status:true})
        })
     })
  },
  getTotalAmount:function(userId) {
     return new Promise(async(resolve, reject) => {
        let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart.products.length > 0)
        {
           let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
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
              },
              {
                 $project:
                 {
                    item:1, quantity:1, product:{$arrayElemAt:['$product', 0]}
                 }
              },
              {
                 $group:
                 {
                    _id:null,
                    total:{$sum:{$multiply:['$quantity', '$product.price']}}
                 }
              }
           ]).toArray()
              resolve(total[0].total)
         } 
         else
         {
            resolve(0)
         }
     })
  },
  getCartProductList:function(userId) {
     return new Promise(async(resolve, reject) => {
        let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
        resolve(cart.products)
     })
  },
  placeOrder:function(order, products, totalPrice) {
     return new Promise((resolve, reject) => {
        if(products[0].buyNow)
        {
           products[0].item = objectId(products[0].item)
           delete products[0].buyNow
           var buyNow = true
        }
        let orderStatus = order['payment-method']==='COD'?'Placed':'Pending'
        status = []
        if(orderStatus === 'Placed')
           status = [{name:'Placed', date:new Date()}]
        else
           status = [{name:'Pending', date:new Date()}]
        let orderObj = {
           user:objectId(order.user), 
           deliveryDetails:{
              name:order.name,
              mobile:order.mobile, 
              address:order.address, 
              pincode:order.pincode,
           }, 
           products:products, 
           totalAmount:totalPrice,
           paymentMethod:order['payment-method'],
           status:status
        }
        db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
           if(!buyNow)
           {
              db.get().collection(collections.CART_COLLECTION).removeOne({user:objectId(order.user)})
           }
           buyNow = null
           resolve(response.ops[0])
        })
     })
  },
  getUserOrders:function(userId) {
     return new Promise(async(resolve, reject) => {
        let orders = await db.get().collection(collections.ORDER_COLLECTION).find({user:objectId(userId)}).sort({_id:-1}).toArray()
        resolve(orders)
     })
  },
  generateRasorpay:function(orderId, total) {
     return new Promise((resolve, reject) => {
        var options = {
        amount: total*100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: orderId.toString()
        };
        instance.orders.create(options, function(err, order) {
        resolve(order)
        });
     })
  },
  verifyPayment:function(details) {
     return new Promise((resolve, reject) => {
        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', 'uOzWvQVVODrUw6cBw5FnCVg6');
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
        hmac = hmac.digest('hex')
        if(hmac == details['payment[razorpay_signature]'])
        {
           resolve()
        }
        else
        {
           reject()
        }
     })
  },
  changePaymentStatus:function(orderId) {
     return new Promise((resolve, reject) => {
        let status = [{name:'Placed', date:new Date()}]
        db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:objectId(orderId)}, 
        {
           $set:
           {
              status:status
           }
        }).then(() => {
           resolve()
        })
     })
  },
  viewAllUsers:function() {
    return new Promise(async(resolve, reject) => {
      let users = await db.get().collection(collections.USER_COLLECTION).find().toArray();
      resolve(users);
    })
  },
  getUserDetails:function(userId) {
     return new Promise(async(resolve, reject) => {
        let user = await db.get().collection(collections.USER_COLLECTION).findOne({_id:objectId(userId)})
        resolve(user)
     })
  },
  changeUserStatus:function(userId, status) {
     return new Promise((resolve, reject) => {
        status = JSON.parse(status)
        db.get().collection(collections.USER_COLLECTION).updateOne({_id:objectId(userId)},
        {
           $set:{active:status}
        }).then((response) => {
           resolve(response)
        })
     })
  },
  updateAccount:function(userData, userId) {
     return new Promise((resolve, reject) => {
       db.get().collection(collections.USER_COLLECTION).updateOne({_id:objectId(userId)},
       {
          $set:
          {
             name:userData.name,
             email:userData.email,
             mobile:userData.mobile,
             address:userData.address
          }
       }).then((response) => {
          if(userData.mobile == "")
             db.get().collection(collections.USER_COLLECTION).updateOne({_id:objectId(userId)},{$unset:{mobile:1}})
          if(userData.address == "")
             db.get().collection(collections.USER_COLLECTION).updateOne({_id:objectId(userId)},{$unset:{address:1}})
          resolve(response)
       })
     });
  },
  deleteUser:function(userId) {
     return new Promise((resolve, reject) => {
        db.get().collection(collections.USER_COLLECTION).removeOne({_id:objectId(userId)}).then((response) => {
           db.get().collection(collections.CART_COLLECTION).removeOne({user:objectId(userId)})
           db.get().collection(collections.ORDER_COLLECTION).removeMany({user:objectId(userId)})
           resolve(response)
        })
     })
  },
  viewAllAdmins:function() {
    return new Promise(async(resolve, reject) => {
      let admins = await db.get().collection(collections.ADMIN_COLLECTION).find().toArray();
      resolve(admins);
    })
  },
  addAdmin:function(adminData) {
     return new Promise(async(resolve, reject) =>  {
        adminData.date = new Date()
        adminData.active = true
        let admin = await db.get().collection(collections.ADMIN_COLLECTION).findOne({email:adminData.email});
        if(admin)
        {
          resolve({status:false})
        }
        else
        {
          adminData.password = await bcrypt.hash(adminData.password, 10);
          db.get().collection(collections.ADMIN_COLLECTION).insertOne(adminData).then((response) => {
            resolve({status:true});
          });
        }
     })
  },
  getAdminDetails:function(adminId) {
     return new Promise(async(resolve, reject) => {
        let admin = await db.get().collection(collections.ADMIN_COLLECTION).findOne({_id:objectId(adminId)})
        resolve(admin)
     })
  },
  changeAdminStatus:function(adminId, status) {
     return new Promise((resolve, reject) => {
        status = JSON.parse(status)
        console.log(adminId, status)
        db.get().collection(collections.ADMIN_COLLECTION).updateOne({_id:objectId(adminId)},
        {
           $set:{active:status}
        }).then((response) => {
           resolve(response)
        })
     })
  },
  changeAdminPosition:function(adminId, position) {
     return new Promise((resolve, reject) => {
        position = JSON.parse(position)
        console.log(adminId, position)
        if(position)
        {
           db.get().collection(collections.ADMIN_COLLECTION).updateOne({_id:objectId(adminId)},
           {
              $set:{super:position}
           }).then((response) => {
              resolve(response)
           })
        }
        else
        {
           db.get().collection(collections.ADMIN_COLLECTION).updateOne({_id:objectId(adminId)},
           {
              $unset:{super:1}
           }).then((response) => {
              resolve(response)
           })
        }
     })
  },
  deleteAdmin:function(adminId) {
     return new Promise((resolve, reject) => {
        db.get().collection(collections.ADMIN_COLLECTION).removeOne({_id:objectId(adminId)}).then((response) => {
           resolve(response)
        })
     })
  },
  searchUser:function(search) {
     return new Promise(async(resolve, reject) => {
        let searchResult = await db.get().collection(collections.USER_COLLECTION).find({$or:[{name:{'$regex' : search, '$options' : 'i'}}, {email:{'$regex' : search, '$options' : 'i'}}, {status:{'$regex' : search, '$options' : 'i'}}]}).toArray()
        resolve(searchResult)
     })
  },
  searchAdmin:function(search) {
     return new Promise(async(resolve, reject) => {
        let searchResult = await db.get().collection(collections.ADMIN_COLLECTION).find({$or:[{name:{'$regex' : search, '$options' : 'i'}}, {email:{'$regex' : search, '$options' : 'i'}}, {status:{'$regex' : search, '$options' : 'i'}}, {super:{'$regex' : search, '$options' : 'i'}}]}).toArray()
        resolve(searchResult)
     })
  }
}
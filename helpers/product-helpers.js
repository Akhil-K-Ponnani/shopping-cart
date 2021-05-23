var objectId = require('mongodb').ObjectID;
var db = require('../config/connection');
var collections = require('../config/collections');

module.exports = {
  addProduct:function(product, callback) {
    db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product).then(function(data) {
      callback(data.ops[0]._id);
    })
  },
  viewProducts:function(){
    return new Promise(async(resolve, reject) => {
      let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray();
      resolve(products);
    })
  },
  deleteProduct:function(productId){
    return new Promise((resolve, reject) => {
      db.get().collection(collections.PRODUCT_COLLECTION).removeOne({_id:objectId(productId)}).then((response) => {
        resolve(response)
      })
    })
  }
};
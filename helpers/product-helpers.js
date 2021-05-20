var db = require('../config/connection');

module.exports = {
  addProduct:function(product, callback) {
    db.get().collection('product').insertOne(product).then(function(data) {
      callback(data.ops[0]._id);
    })
  }
};
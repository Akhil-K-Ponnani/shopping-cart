var mongoClient = require('mongodb').MongoClient;
const state = {
  db:null
};

module.exports.connect = function(done) {
  const url=process.env.DB_URI||'mongodb://localhost:27017';
  const dbName=process.env.DB_NAME||'ShoppingCart';
 
  mongoClient.connect(url, function(err, data) {
    if(err)
      return done(err);
    state.db = data.db(dbName);
    done();
  });
}

module.exports.get = function() {
  return state.db;
};
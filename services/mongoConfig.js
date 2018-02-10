/**
 * Created by Javier on 27/09/2016.
 */
"use strict";

var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;

var mongoConfig = function () {
    var db_url = process.env.DB_URL
    if (db_url == null){
      db_url = "localhost"
    }

    var url = 'mongodb://'+db_url+':27017/cincuentax15';

    MongoClient.connect(url, function (err, db) {
        console.log("Connected correctly to MongoDB server");
        global.db = db;
    });

};

module.exports = mongoConfig;

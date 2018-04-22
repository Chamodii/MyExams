var passportLocalMongoose = require("passport-local-mongoose");
var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    password : String,
    firstName:String,
    lastName:String,
    username:String,
    dept:String,
    email:String,
    role: String,
    modules : [{type:mongoose.Schema.Types.ObjectId, ref:'Module'}]
});

UserSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",UserSchema);
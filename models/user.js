var passportLocalMongoose = require("passport-local-mongoose");
var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    password : String,
    firstName:String,
    lastName: String,
    username:String,
    email:String,
    role : String,
    department: String,
    DOB: Date,
    NIC: String,
    batch: Number,
    faculty: String,
    degree: String,
    modules: [{type :mongoose.Schema.Types.ObjectId, ref:'Module'}]
});
//plugin the sub modules to the parent one

//StudentSchema


UserSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",UserSchema);
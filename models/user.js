var passportLocalMongoose = require("passport-local-mongoose");
var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    password : String,
    name : {first : String, last : String},
    username:String,
    email:String,
    roles : {
        student : {type : mongoose.Schema.Types.ObjectId, ref : 'Student'},
        admin : {type : mongoose.Schema.Types.ObjectId, ref : 'Admin'},
        lecturer : {type : mongoose.Schema.Types.ObjectId, ref : 'Lecturer'}
    }
});
//plugin the sub modules to the parent one

//StudentSchema

var StudentSchema = new mongoose.Schema({
   department : String,

});

UserSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",UserSchema);
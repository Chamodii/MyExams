var mongoose = require("mongoose");

var RegisteredSchema = new mongoose.Schema({
    ID : String,
    code: String,
    semester: Number,
    name: String
});

module.exports=mongoose.model("Registered",RegisteredSchema);
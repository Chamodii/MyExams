var mongoose = require("mongoose");

var ModuleSchema = new mongoose.Schema({
    name : String,
    code: String,
    department: String,
    semester: Number
});

module.exports=mongoose.model("Module",ModuleSchema);
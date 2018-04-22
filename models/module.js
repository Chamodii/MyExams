var mongoose = require("mongoose");

var ModuleSchema = new mongoose.Schema({
    name : String,
    code: String,
    students: [{type :mongoose.Schema.Types.ObjectId, ref:'User'}]
});

module.exports=mongoose.model("Module",ModuleSchema);
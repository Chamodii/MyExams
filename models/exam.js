var mongoose = require("mongoose");

var ExamSchema = new mongoose.Schema({
    module : Object,
    name: String,
    code: String,
    semester: Number,
    department: String,
    date: Date,
    timeHours: String,
    timeMins: String,
    venue: String
});

module.exports=mongoose.model("Exam",ExamSchema);
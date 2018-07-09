var mongoose = require("mongoose");

var ExamSchema = new mongoose.Schema({
    module : Object,
    date: Date,
    timeHours: String,
    timeMins: String,
    venue: String
});

module.exports=mongoose.model("Exam",ExamSchema);
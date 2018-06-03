var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require("mongoose");
var cookieParser = require('cookie-parser');
var passport = require("passport");
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(require('express-session')({
    secret: "Heil Hitler",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));




mongoose.connect("mongodb://localhost/students_app");

var User = require('./models/user');
var Module = require('./models/module');

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/',function (req,res) {
    res.render("home");
});

app.get('/login',function (req,res) {
    res.render("login");
});

app.post('/create',function(req,res){
    req.body.username
    req.body.password
    req.body.firstName
    req.body.lastName
    req.body.email
    req.body.dept
    req.body.role

    User.register(new User({firstName: req.body.firstName,lastName:req.body.lastName,dept:req.body.dept,username:req.body.username,email:req.body.email,role:req.body.role}), req.body.password, function(err,user){
        if(err){
            console.log(err);
            return res.render('login');
        }
        passport.authenticate('local')(req,res,function(){
            res.redirect("/logged");
        });
    });
});

app.post('/login',passport.authenticate('local',{
    successRedirect:'/logged',
    failureRedirect:'/login'
}),function(req,res){});

app.get('/logged',function (req,res) {
    var user = req.user;
    res.render('userhome',{user:user});
});

app.get('/profile',function (req,res) {
    var user = req.user;
    res.render('profile',{user:user});
});

app.get('/calendar',function (req,res) {
    var user = req.user;
    res.render('calendar',{user:user});
});

app.get('/downloads',function (req,res) {
    var user = req.user;
    res.render('downloads',{user:user});
});

app.get('/repeat',function (req,res) {
    res.render('repeat register')
});

app.get('/repeat/view',function (req,res) {
    res.render('repeat view.ejs');
});

app.get('/repeat/register',function (req,res) {
    res.render('exam register');
});

app.get('/reg',function (req,res) {
    res.render('exam reg2');
});

// app.get('/login/:id/:password',function(req,res){
//    var user = req.body.username;
//    var password=req.body.password;
// });

app.listen(3000);
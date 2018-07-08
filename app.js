var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require("mongoose");
var cookieParser = require('cookie-parser');
var passport = require("passport");
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var flash = require('connect-flash');


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
app.use(flash());

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
    res.render("login",{message: req.flash('userExists')});
});

app.post('/create',function(req,res){
    var newUser = new User({firstName: req.body.firstName,lastName:req.body.lastName,username:req.body.username,email:req.body.email});
    if(req.body.role==="admin123"){
        newUser.role="Admin";
        User.register(newUser, req.body.password, function(err,user){
            if(err){
                console.log(err);
                req.flash('userExists','User already exists!');
                res.redirect('/login');
            }
            passport.authenticate('local')(req,res,function(){
                //This should be redirected to admin home
                console.log("Admin successfully created");
                //res.redirect("/logged");
            });
        });
    }


});

app.post('/login',passport.authenticate('local',{
    successRedirect:'/logged',
    failureRedirect:'/login'
}),function(req,res){});

app.get('/logged',function (req,res) {
    var user = req.user;
    if(user!=null){
        if(user.role==="Admin"){
            //direct to admin home
            res.render('adminhome');
        }
        else if(user.role==="Student"){
            res.render('userhome',{user:user});
        }
        else if(user.role==="Lecturer"){
            res.send("I am a lecturer");
        }

    }
    else{
        console.log("User not logged");
        res.send("User not logged");
    }
});

app.get('/editProfile',function (req,res) {
    var user = req.user;
    if(user!=null){res.render('profile',{user:user});}
    else{
        res.send("User not logged");
    }
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

//This should be altered to post repeat : pass the data from repeat form
// app.get('/repeat/register',function (req,res) {
//     res.render('exam register');
// });

app.get('/reg',function (req,res) {
    if(req.user!=null && req.user.role==='Student'){
        res.render('exam register',{user:req.user});
    }
    else{
        res.redirect('/');
    }
});

app.post('/reg/:id',function (req,res) {
   User.findOne({_id:req.params.id},function (err,user) {
       if(err){
           console.log(err);
       }
       else{
           Module.find({department: user.department,semester:req.body.semester},function (err,modules) {
               res.render('exam reg2',{modules:modules});
           })
       }
   })
});

app.post('/registerExams/:id',function (req,res) {
    User.update({_id:req.params.id},{modules:req.body.module},function(err,user) {
        if(err){
            console.log(err);
        }else{
            res.redirect('/logged');
        }
    });
});

app.get('/registerStudent',function (req,res) {
    if(req.user!=null && req.user.role==="Admin"){
        res.render('student registration',{message:req.flash('userExists')});
    }
    else{
        res.redirect('/');
    }
});

app.get('/registerModule',function (req,res) {
    if(req.user!=null && req.user.role==="Admin"){
        res.render('module registration',{message: req.flash('notify')});
    }
});

app.post('/registerStudent',function (req,res) {
    var newUser = new User({firstName: req.body.firstName,lastName:req.body.lastName,username:req.body.username,DOB:req.body.DOB,batch:req.body.batch,role:"Student",department:req.body.department,faculty:req.body.faculty,NIC:req.body.NIC,degree:req.body.degree});
    User.register(newUser, req.body.password, function(err,user){
        if(err){
            console.log(err);
            req.flash('userExists','User already exists!');
            res.redirect('/registerStudent');
        }
        passport.authenticate('local')(req,res,function(){
            //This should be redirected to admin home
            console.log("User successfully created");
            res.redirect("/viewStudents");
        });
    });
});

app.post('/registerModule',function(req,res){
    Module.find({code:req.body.code,department:req.body.department},function (err,modules) {
       if(err){
           console.log(err);
       } else{
           if(modules.length===0){
               var newModule=new Module({name:req.body.name, code:req.body.code,semester:req.body.semester,department:req.body.department});
               newModule.save(function (err) {
                   if(err){
                       return res.status(500).send(err);
                   }
                   res.redirect('/viewDepartments');
               });
           }
           else{
               req.flash('notify','Module already exists');
               res.redirect('/registerModule');
           }

       }
    });

});

app.get('/viewStudents',function (req,res) {
    User.find({role:"Student"},function (err,users) {
        if(err){
            console.log(err);
        }else{
            res.render('viewStudents',{users:users});
        }

    });

});

app.get('/editStudent/:id',function (req,res) {
   User.findOne({_id:req.params.id},function (err,user) {
       if(err){
           console.log(err);
       }else{
           res.render('editStudent',{user:user});
       }
   });
});

app.post('/editStudent/:id',function (req,res){
    var data={firstName:req.body.firstName,lastName:req.body.lastName,username:req.body.username,DOB:req.body.DOB,batch:req.body.batch,role:"Student",faculty:req.body.faculty,NIC:req.body.NIC,degree:req.body.degree,department:req.body.department};
   User.remove({_id:req.params.id},function (err,user) {
       if(err){console.log(err)}
       else{
           console.log('Deleted');

       }
   });
    User.register(data, req.body.password, function(err,user){
        if(err){
            console.log(err);
            return res.send("User already exists");
        }
        passport.authenticate('local')(req,res,function(){
            //This should be redirected to admin home
            console.log("User successfully created");
            res.redirect("/viewStudents");
        });
    });
});

app.post('/deleteStudent/:id',function (req,res) {
   User.remove({_id:req.params.id},function (err,user) {
       if(err){
           console.log(err);
       }else{
           res.redirect("/viewStudents");
       }
   });
});




app.get('/viewModules/:department',function (req,res) {
   var dep=req.params.department;
   Module.find({department:dep},function (err,modules) {
       if(err){
           console.log(err);
       }else{
           res.render('viewModules',{modules:modules});
       }
   })
});

app.get('/viewDepartments',function(req,res){
  res.render('viewDepartments');
});

app.get('/registerLecturer',function (req,res) {
    var user = req.user;
    if(user!=null && user.role==='Admin'){
        res.render('lecturer registration',{message: req.flash('userExists')});
    }
    else{
        res.redirect('/');
    }

});

app.post('/registerLecturer',function (req,res){
    var data={firstName:req.body.firstName, lastname:req.body.lastName,department:req.body.department,role:'Lecturer',username:req.body.username, NIC:req.body.NIC,faculty:req.body.faculty};
    User.register(data, req.body.password, function(err,user){
        if(err){
            console.log(err);
            req.flash('userExists','User already exists!');
            res.redirect('/registerLecturer');
        }
        passport.authenticate('local')(req,res,function(){
            //This should be redirected to admin home
            console.log("User successfully created");
            res.redirect("/viewLecturers");
        });
    });

});

app.get('/viewLecturers',function (req,res) {
   User.find({role:'Lecturer'},function (err,users) {
       if(err){
           console.log(err);
       }
       else{
           res.render('viewLecturers',{users:users});
       }
   })
});

app.get('/editLecturer/:id',function (req,res) {
    User.findOne({_id:req.params.id},function (err,user) {
        if(err){
            console.log(err);
        }else{
            res.render('editLecturer',{user:user});
        }
    });
});

app.post('/editLecturer/:id',function (req,res){
    var data={firstName:req.body.firstName,lastName:req.body.lastName,username:req.body.username,role:"Lecturer",faculty:req.body.faculty,NIC:req.body.NIC,department:req.body.department};
    User.remove({_id:req.params.id},function (err,user) {
        if(err){console.log(err)}
        else{
            console.log('Deleted');

        }
    });
    User.register(data, req.body.password, function(err,user){
        if(err){
            console.log(err);
            return res.send("User already exists");
        }
        passport.authenticate('local')(req,res,function(){
            //This should be redirected to admin home
            console.log("User successfully created");
            res.redirect("/viewLecturers");
        });
    });
});

app.post('/deleteLecturer/:id',function (req,res) {
    User.remove({_id:req.params.id},function (err,user) {
        if(err){
            console.log(err);
        }else{
            res.redirect("/viewLecturers");
        }
    });
});

app.post('/editProfile/:id',function (req,res) {
    User.update({_id:req.params.id},{email:req.body.email},function(err,user) {
        if(err){
            console.log(err);
        }else{
            res.redirect('/logged');
        }
    });
});


app.listen(3000);
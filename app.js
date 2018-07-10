var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require("mongoose");
var cookieParser = require('cookie-parser');
var passport = require("passport");
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var flash = require('connect-flash');
var validator = require("validator");


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
var Exam = require('./models/exam');
var Registered = require('./models/registeredmodule');


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/',function (req,res) {
    req.logout();
    res.render("home");
});

app.get('/login',function (req,res) {
    res.render("login",{message: req.flash('userExists')});
});

app.post('/create',function(req,res){
    var newUser = new User({firstName: req.body.firstName,lastName:req.body.lastName,username:req.body.username,email:req.body.email});
    if(req.body.role==="admin123"){
        var index=req.body.username;
        if(isNaN(index.substring(index.length-1,index.length)) && !isNaN(index.substring(0,index.length - 1))){
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
                    res.redirect("/logged");
                });
            });
        }else{
            req.flash('userExists','Incorrect ID');
            res.redirect('/login');
        }

    }
    else{
        req.flash('userExists','Incorrect signup');
        res.redirect('/login');
    }


});

app.post('/login',passport.authenticate('local',{
    successRedirect:'/logged',
    failureRedirect:'/login'
}),function(req,res){
    req.flash('userExists','ID or password does not match');
});

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
            res.render('lecturerhome');
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
    Exam.find({department:user.department},function (err,exams) {
        if(err){
            console.log(err);
        }
        else{
            res.render('calendar',{exams:exams});
        }
    });

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


app.get('/reg',function (req,res) {
    if(req.user!=null && req.user.role==='Student'){
        res.render('exam register',{user:req.user, message: req.flash('notify')});
    }
    else{
        res.redirect('/');
    }
});

app.post('/reg/:id',function (req,res) {
   User.findOne({username:req.params.id},function (err,user) {
       if(err){
           console.log(err);
       }
       else{
           Module.find({department: user.department,semester:req.body.semester},function (err,modules) {
               res.render('exam reg2',{modules:modules,user:user});
           })
       }
   })
});

app.post('/registerExams/:userid/:moduleid',function (req,res) {
    Module.findOne({code:req.params.moduleid},function (err,module) {
       if(err){
           console.log(err);
       } else{
           Registered.find({ID:req.params.userid,code:req.params.moduleid},function (err,regs) {
               if(err){
                   console.log(err);
               }
               else{
                   if(regs.length===0){
                       var newExam=new Registered({ID:req.params.userid,name:module.name,code:module.code,semester:module.semester});
                       newExam.save(function (err) {
                           if(err){
                               return res.status(500).send(err);
                           }
                           res.redirect('/reg');
                       });
                   }
                   else{
                       req.flash('notify','Module already registered');
                       res.redirect('/reg');
                   }
               }
           });

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
    var today = new Date();
    var DOB = new Date(req.body.DOB);
    var index = req.body.username;
    if(validator.isAlpha(req.body.firstName)  && validator.isAlpha(req.body.lastName)) {
        if(isNaN(index.substring(index.length-1,index.length)) && !isNaN(index.substring(0,index.length - 1))){
            if(today>DOB){
                var nic = req.body.NIC;
                if(nic.substring(nic.length-1,nic.length).toLowerCase() === 'v' && !isNaN(nic.substring(0,nic.length - 1)) ){
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
                }
                else{
                    req.flash('userExists','Invalid NIC');
                    res.redirect('/registerStudent');
                }


            }
            else{
                req.flash('userExists','Invalid Date of Birth');
                res.redirect('/registerStudent');
            }
        }
        else {
            req.flash('userExists','Invalid ID');
            res.redirect('/registerStudent');
        }
    }
    else {
        req.flash('userExists','Invalid name');
        res.redirect('/registerStudent');
    }



});

app.post('/registerModule',function(req,res){
    if(validator.isAlpha(req.body.name)){
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
    }
    else{
        req.flash('notify','Invalid module name');
        res.redirect('/registerModule');
    }



});

app.post('/deleteModule/:id',function (req,res) {
    Module.remove({_id:req.params.id},function (err,module) {
        if(err){
            console.log(err);
        }else{
            res.redirect("/viewDepartments");
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
           res.render('editStudent',{user:user , message: req.flash('userExists')});
       }
   });
});

app.post('/editStudent/:id',function (req,res){
    var today = new Date();
    var DOB = new Date(req.body.DOB);
    var index = req.body.username;
    if(validator.isAlpha(req.body.firstName)  && validator.isAlpha(req.body.lastName)) {
        if (isNaN(index.substring(index.length - 1, index.length)) && !isNaN(index.substring(0, index.length - 1))) {
            if (today > DOB) {
                var nic = req.body.NIC;
                if (nic.substring(nic.length - 1, nic.length).toLowerCase() === 'v' && !isNaN(nic.substring(0, nic.length - 1))) {
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

                }
                else{
                    req.flash('userExists','Invalid NIC');
                    res.redirect('/editStudent/'+req.params.id);
                }
            }
            else{
                req.flash('userExists','Invalid DOB');
                res.redirect('/editStudent/'+req.params.id);
            }
        }
        else{
            req.flash('userExists','Invalid ID');
            res.redirect('/editStudent/'+req.params.id);
        }
    }
    else{
        req.flash('userExists','Invalid name');
        res.redirect('/editStudent/'+req.params.id);
    }







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
    var data={firstName:req.body.firstName, lastName:req.body.lastName,department:req.body.department,role:'Lecturer',username:req.body.username, NIC:req.body.NIC,faculty:req.body.faculty};
    var index = req.body.username;
    var nic = req.body.NIC;
    if (validator.isAlpha(req.body.firstName)  && validator.isAlpha(req.body.lastName) ){
        if(isNaN(index.substring(index.length-1,index.length)) && !isNaN(index.substring(0,index.length - 1))){
            if(nic.substring(nic.length-1,nic.length).toLowerCase() === 'v' && !isNaN(nic.substring(0,nic.length - 1))){
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
            }
            else{
                req.flash('userExists','Invalid NIC');
                res.redirect('/registerLecturer');
            }

        }
        else{
            req.flash('userExists','Invalid ID');
            res.redirect('/registerLecturer');
        }
    }
    else{
        req.flash('userExists','Invalid name');
        res.redirect('/registerLecturer');
    }




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
            res.render('editLecturer',{user:user ,message: req.flash('userExists')});
        }
    });
});

app.post('/editLecturer/:id',function (req,res){
    var index = req.body.username;
    var nic = req.body.NIC;
    if (validator.isAlpha(req.body.firstName)  && validator.isAlpha(req.body.lastName) ) {
        if (isNaN(index.substring(index.length - 1, index.length)) && !isNaN(index.substring(0, index.length - 1))) {
            if (nic.substring(nic.length - 1, nic.length).toLowerCase() === 'v' && !isNaN(nic.substring(0, nic.length - 1))) {
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
            }
            else{
                req.flash('userExists','Invalid NIC');
                res.redirect('/editLecturer/'+req.params.id);
            }
        }
        else{
            req.flash('userExists','Invalid ID');
            res.redirect('/editLecturer/'+req.params.id);
        }
    }
    else{
        req.flash('userExists','Invalid name');
        res.redirect('/editLecturer/'+req.params.id);
    }






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

app.get('/setCalendar',function (req,res) {
    if(req.user!=null && req.user.role==="Admin"){
        Module.find({},function(err,modules){
            if(err){
                console.log(err);
            }
            else{
                res.render('setCalendar',{modules:modules, message:req.flash('notify')});
            }
        });
    }
    else{
        res.redirect('/');
    }
});

app.post('/setCalendar',function (req,res) {
    Module.findOne({_id:req.body.module},function (err,module) {
        var today = new Date();
        var examDate = new Date(req.body.date);
        if(validator.isAlpha(req.body.venue)){
            Exam.find({module:module},function(err,exams){
                if(exams.length===0){
                    if(examDate>today){
                        var newExam = new Exam({module:module,date:req.body.date,timeHours:req.body.timeHours,timeMins:req.body.timeMins,venue:req.body.venue});
                        newExam.save(function (err) {
                            if(err){
                                console.log(err);
                            }
                            else{
                                res.redirect("/setCalendar");
                            }
                        });
                        // res.redirect('/viewCalendar');

                    }
                    else{
                        req.flash('notify','Invalid date');
                        res.redirect('/setCalendar');
                    }
                }
                else{
                    req.flash('notify','Exam already exists');
                    res.redirect('/setCalendar');
                }
            });
        } else{
            req.flash('notify','Invalid venue name');
            res.redirect('/setCalendar');
        }


    });

});

app.get('/viewCalendar',function (req,res) {
    Exam.find({},function (err,exams) {
        res.render('calendar',{exams:exams});
    });

});

app.get('/about',function (req,res) {
    res.render('aboutus');
});

app.get('/contact',function (req,res) {
   res.render('contactus');
});

// var moduleObjects=[];
app.get('/subjectStructure',function (req,res) {
    var moduleObjects = new Array();
    var modules= req.user.modules;
    console.log(modules[0]);
    // var moduleObjects=[];
    // modules.forEach(function (moduleCode) {
    for(var i=0 ;i<modules.length ;i++){
        var mode = Module.findOne({code:modules[i]},function (err,module) {

            if(err){
                console.log(err);
            }
            else{
                // var moduledata = [module.name,module.code,module.department];
                // // console.log(module);
                // // moduleObjects.push(moduledata);
                // return module;
                moduleObjects[i]= module;

            }
        });
        // console.log(mode);

    }

    console.log(moduleObjects);
    res.render('subjectStructure',{modules:moduleObjects});
});
app.listen(3000);
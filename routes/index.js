var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index');
});

router.get('/register', function (req, res, next) {
  res.render('register');
});

router.get('/profile', isLoggedIn, async function (req, res, next) {
 const user = await userModel.findOne({username: req.session.passport.user}).populate("post");
 res.render("profile", {user});
});

router.get('/show/post', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user}).populate("post");
  res.render("show", {user});
 });

 router.get('/feed', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  const post =  await postModel.find().populate("user");
  res.render("feed", {user, post});
 }); 

router.get('/add', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
 res.render("add",{user});
 });

router.post('/createpost', isLoggedIn, upload.single("postimage"), async function (req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });

  user.post.push(post._id);
  await user.save();
  res.redirect("/profile");
});

router.post('/fileupload', isLoggedIn, upload.single("image"),async function(req, res, next){
  const user = await userModel.findOne({username: req.session.passport.user});
  user.profileImage = req.file.filename;
  user.save();
  res.redirect("/profile"); 
});

router.post('/register', function (req, res, next) {
  const data = new userModel({
    username: req.body.username,
    email: req.body.email,
    contact: req.body.contact,
    name: req.body.fullname,
    secret: req.body.secret
  });

  userModel.register(data, req.body.password).then(function (registereduser) {
      passport.authenticate("local")(req, res, function () {
        res.redirect('/profile');
    })
  })
});


router.post("/login", passport.authenticate("local", {
  failureRedirect: "/",
  successRedirect: "/profile",
}),function(req, res,next){
});  

router.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});
 
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/");
}

module.exports = router;

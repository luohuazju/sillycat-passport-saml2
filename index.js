const express = require('express');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
app.use(express.static(__dirname));

const expressSession = require('express-session')({
  secret: 'mydemosecret',
  resave: false,
  saveUninitialized: true
});
app.use(expressSession);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new SamlStrategy(
    {
        path: "/saml2/auth0/callback",
        entryPoint: process.env.AUTH0_SAML2_URL,
        issuer: "passport-saml",
        // Identity Provider's public key
        cert: fs.readFileSync("./cert/saml2-auth0.pem", "utf8"),
    },
    function(profile, cb) {
        const user = { 
        	id: profile["nameID"], 
        	email: profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"], 
        	userName: profile["http://schemas.auth0.com/nickname"]
        };
        console.log("user:" + JSON.stringify(user));
        return cb(null, user);
    }
));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

app.get('/', (req, res) => res.sendFile('html/auth.html', { root : __dirname}));
app.get('/success', (req, res) => {
	console.log("success :" + JSON.stringify(req.user));
	res.send(req.user.userName + ", You have successfully logged in")
});
app.get('/error', (req, res) => res.send("error logging in"));

app.get('/saml2/auth0',
	passport.authenticate("saml",
	  {
	    successRedirect: '/success',
	    failureRedirect: '/error'
	  })
);
app.post('/saml2/auth0/callback',
  bodyParser.urlencoded({ extended: false }),
  passport.authenticate('saml', { failureRedirect: '/error', failureFlash: true }),
  function(req, res) {
  	console.log("---req user:" + JSON.stringify(req.user));
    res.redirect('/success');
  }
);

const port = process.env.PORT || 3000;
app.listen(port , () => console.log('App listening on port ' + port));


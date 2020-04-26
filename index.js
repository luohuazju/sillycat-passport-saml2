const express = require('express');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const fs = require('fs');

const app = express();
app.use(express.static(__dirname));
app.use(passport.initialize());
app.use(passport.session());
const expressSession = require('express-session')({
  secret: 'mydemosecret',
  resave: false,
  saveUninitialized: false
});
app.use(expressSession);

passport.use(new SamlStrategy(
    {
        path: "/saml2/auth0/callback",
        entryPoint: process.env.AUTH0_SAML2_URL,
        issuer: "passport-saml",
        // Identity Provider's public key
        cert: fs.readFileSync("./cert/saml2-auth0.pem", "utf8"),
    },
    (profile, cb) => {
        console.log("Profile : ", profile);
        const user = { id: profile["nameID"], userName: profile["http://schemas.auth0.com/nickname"] };
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
app.get('/success', (req, res) => res.send("You have successfully logged in"));
app.get('/error', (req, res) => res.send("error logging in"));
app.get("/saml2/auth0",
    passport.authenticate("saml", (err, profile) => {  
        console.log("Profile : ", profile);
    })
);
app.post("/saml2/auth0/callback",
    (req, res, next) => {
        passport.authenticate("saml", { session: false }, (err, user) => {
            req.user = user;
            next();
        })(req, res, next);
    },
    function(req, res) {
    	res.redirect('/success');
  	}
);

const port = process.env.PORT || 3000;
app.listen(port , () => console.log('App listening on port ' + port));


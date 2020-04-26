const express = require('express');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;

const app = express();
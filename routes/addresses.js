const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// load prefix model
require('../models/Prefix');
const Prefix = mongoose.model('prefixes');

// load site model
require('../models/Site');
const Site = mongoose.model('sites');

// load address model
require('../models/Address');
const Address = mongoose.model('addresses');

// add prefix route
router.get('/add', (req, res) => {
  res.render('addresses/add');
});

// process address creation form
router.post('/add', (req, res) => {

});

module.exports = router;
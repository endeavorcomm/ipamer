const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// load site model
require('../models/Site');
const Site = mongoose.model('sites');

// add site route
router.get('/add', (req, res) => {
  res.render('sites/add');
});

// process site creation form
router.post('/add', (req, res) => {
  let name = req.body.name;
  name = name.replace(" ", "_");
  let errors = [];

  // check if site exists, case insensitive using regexp
  Site.findOne({name: new RegExp('\\b' + name + '\\b', 'i')})
  .then(site => {
    if(site !== null) {
      errors.push({
        text: 'Site Already Exists'
      });
      res.render('sites/add', {
        errors: errors,
        name: req.body.name,
        description: req.body.description,
        alias: req.body.alias
      });
    } else {
      let name = req.body.name;
      name = name.replace(" ", "_");
      const newSite = new Site({
        name: name,
        description: req.body.description,
        alias: req.body.alias
      });

      newSite.save()
        .then(site => {
          req.flash('success_msg', `Site ${site.name} added!`);
          res.redirect('/sites/add');
        })
        .catch(err => {
          req.flash('error_msg', 'Failed to add site.');
          console.log(err);
          return;
        });
    }
  });
});

module.exports = router;
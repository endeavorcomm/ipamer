const express = require('express');
const router = express.Router();

// load site model
Site = require('../models/Site');

// add site route
router.get('/add', (req, res) => {
  res.render('sites/add');
});

// site status route
router.get('/status', (req, res) => {
  // query sites
  Site.find({}, {prefixes: 1, name: 2, description: 3, alias: 4, _id: 0}).sort({name: 1})
    .then(sites => {
      res.render('sites/status', {
        site: sites
      });
    });
})

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
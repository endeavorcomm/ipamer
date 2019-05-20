const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// load prefix model
require('../models/Prefix');
const Prefix = mongoose.model('prefixes');

// load site model
require('../models/Site');
const Site = mongoose.model('sites');

// add prefix route
router.get('/add', (req, res) => {
  res.render('prefixes/add');
});

// process prefix creation form
router.post('/add', (req, res) => {
  let prefix = req.body.prefix;
  let type = req.body.type;
  let site = req.body.site;
  let errors = [];

  // check if prefix exists
  Prefix.findOne({prefix: prefix})
  .then(prefix => {
    if(prefix !== null) {
      errors.push({
        text: 'Prefix Already Exists'
      });
      if (type == 'static') {
        // send response and set checked for static radio button
        res.render('prefixes/add', {
          errors: errors,
          name: req.body.name,
          static: req.body.type,
          prefix: req.body.prefix,
          gateway: req.body.gateway,
          subnet: req.body.subnet,
          description: req.body.description,
          system: req.body.system,
          site: req.body.site
        });
      } else {
        // send response and set checked for dhcp radio button
        res.render('prefixes/add', {
          errors: errors,
          name: req.body.name,
          dhcp: req.body.type,
          prefix: req.body.prefix,
          gateway: req.body.gateway,
          subnet: req.body.subnet,
          description: req.body.description,
          system: req.body.system,
          site: req.body.site
        });
      }
    } else if (type == null) {
      // check if a Type was choosen
      errors.push({
        text: 'Please choose a Type'
      });
      res.render('prefixes/add', {
        errors: errors,
        name: req.body.name,
        prefix: req.body.prefix,
        gateway: req.body.gateway,
        subnet: req.body.subnet,
        description: req.body.description,
        system: req.body.system,
        site: req.body.site
      });
    } else if (site !== null) {
      // Check if typed in site matches an existing site
      Site.findOne({name: new RegExp('\\b' + site + '\\b', 'i')})
        .then(site => {
          if(site !== null) {
            // matches existing site, create prefix
            const newPrefix = new Prefix({
              name: req.body.name,
              type: req.body.type,
              prefix: req.body.prefix,
              gateway: req.body.gateway,
              subnet: req.body.subnet,
              description: req.body.description,
              system: req.body.system,
              site: req.body.site
            });
    
            newPrefix.save()
              .then(prefix => {
                req.flash('success_msg', `Prefix ${prefix.prefix} added!`);
                res.redirect('/prefixes/add');
              })
              .catch(err => {
                req.flash('error_msg', 'Failed to add prefix.');
                console.log(err);
                return;
              });
          } else {
            // doesn't match existing site
            errors.push({
              text: 'Site Doesn\'t Exist. Please Select an Available Site'
            });

            if (type == 'static') {
              // send response and set checked for static radio button
              res.render('prefixes/add', {
                errors: errors,
                name: req.body.name,
                static: req.body.type,
                prefix: req.body.prefix,
                gateway: req.body.gateway,
                subnet: req.body.subnet,
                description: req.body.description,
                system: req.body.system,
                site: req.body.site
              });
            } else {
              // send response and set checked for dhcp radio button
              res.render('prefixes/add', {
                errors: errors,
                name: req.body.name,
                dhcp: req.body.type,
                prefix: req.body.prefix,
                gateway: req.body.gateway,
                subnet: req.body.subnet,
                description: req.body.description,
                system: req.body.system,
                site: req.body.site
              });
            }
          }
        });
    }
  });
});

module.exports = router;
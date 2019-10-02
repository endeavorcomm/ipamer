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
  Site.find({}, {}).sort({name: 1})
    .then(sites => {
      res.render('sites/status', {
        site: sites
      });
    });
})

// site detail route
router.get('/site/:_id', (req, res) => {
  const _id = req.params._id;

  // query site
  Site.findOne({_id: _id}, {})
    .then(site => {
      res.render('sites/site', {
        site: site
      });
    });
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

// process site delete form
router.post('/delete', (req, res) => {
  const siteName = req.body.siteName;

  // build redirect url from headers
  const reqHost = req.headers.host;
  const reqURL = `http://${reqHost}/sites/status`;
  
  // get site from site name
  Site.findOne({name: siteName}, {})
    .then(siteFound => {
      const site = siteFound.name;

      // get all prefixe that are assigned to the site
      Prefix.find({site: site}, {})
        .then(prefixesFound => {
          prefixesFound.forEach((prefix) => {
            // find addresses are assigned to a customer
            if (prefix.site != '') {
              Prefix.updateOne({_id: prefix._id.toString()}, {site: ''}, (err, record) => {
                if (err) {
                  throw err;
                } else {
                  // site removed from prefix!
                }
              });
            }
          });
        });

      // remove site
      Site.deleteOne({name: site}, (err) => {
        if (err) {
          throw err;
        } else {
          // site deleted!
          res.redirect(reqURL);
        }
      });
    });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch')

// load site model
Site = require('../models/Site');

// add site route
router.get('/add', (req, res) => {
  res.render('sites/add');
});

// site status route
router.get('/status', (req, res) => {
  // query sites
  (async () => {
    const response = await fetch('https://netbox.weendeavor.com/api/dcim/sites', {
      headers: {'Authorization': `Token ${process.env.NETBOX_API_KEY}`}
    })
    
    const sites = await response.json()
    res.render('sites/status', {
      site: sites.results
    })
  })();
});

// site detail route
router.get('/site/:_id', (req, res) => {
  const _id = req.params._id;

  // query site and prefixes
  Site.findOne({_id: _id}, {})
    .then(site => {
      Prefix.find({site: site.name}, {})
        .then(prefixes => {
          res.render('sites/site', {
            site: site,
            prefixes: prefixes
          });
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

// process site edit form
router.post('/edit', (req, res) => {
  const siteID = req.body.siteID;
  const siteName = req.body.siteName;
  const siteAlias = req.body.siteAlias;
  const siteDesc = req.body.siteDescription;
  const previousSiteName = req.body.siteCurrent;

  // build redirect url from headers
  const reqLocation = req.headers.referer;
  const reqHost = req.headers.host;
  const reqHeader = reqLocation.split(`http://${reqHost}`);
  const reqURL = reqHeader[1];

  Site.updateOne({_id: siteID}, {name: siteName, description: siteDesc, alias: siteAlias})
    .then(ok => {res.redirect(reqURL);});

  Prefix.find({site: previousSiteName}, {})
    .then(prefixesFound => {
      prefixesFound.forEach((prefix) => {
        // change site name to changed name
        Prefix.updateOne({_id: prefix._id.toString()}, {site: siteName}, (err, record) => {
          if (err) {
            throw err;
          } else {
            // site changed for prefix!
          }
        });
      });
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

      // remove site
      Site.deleteOne({name: site}, (err) => {
        if (err) {
          throw err;
        } else {
          // site deleted!
          // set cookie for toast
          res.cookie('IPAMerStatus', 'Site Deleted');
          res.redirect(reqURL);
        }
      });

      // get all prefixes that are assigned to the site
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
    });
});

module.exports = router;
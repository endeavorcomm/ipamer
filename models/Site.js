const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// create Schema
const SiteSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  alias: {
    type: String,
    required: false
  },
  prefixes: {
    type: Array,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

let Site = module.exports = mongoose.model('sites', SiteSchema);

// get sites
module.exports.getSites = (callback, limit) => {
  Site.find(callback).limit(limit);
}
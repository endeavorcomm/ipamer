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

mongoose.model('sites', SiteSchema);
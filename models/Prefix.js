const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// create Schema
const PrefixSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  prefix: {
    type: String,
    required: true
  },
  subnet: {
    type: String,
    required: false
  },
  gateway: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  system: {
    type: String,
    required: false
  },
  site: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('prefixes', PrefixSchema);
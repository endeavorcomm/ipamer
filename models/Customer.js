const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// create Schema
const CustomerSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  addresses: {
    type: Array,
    required: false
  },
  sites: {
    type: Array,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('customers', CustomerSchema);
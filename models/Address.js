const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// create Schema
const AddressSchema = new Schema({
  ip: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  customer: {
    id: {
      type: String,
      required: false
    },
    name: {
      type: String,
      required: false
    }
  },
  prefix: {
    type: String,
    required: true
  },
  gateway: {
    type: String,
    required: true
  },
  subnet: {
    type: String,
    required: false
  },
  site: {
    type: String,
    required: false
  },
  status: {
    type: String,
    default: 'Available'
  },
  description: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

let Address = module.exports = mongoose.model('addresses', AddressSchema);

// get addresses
module.exports.getAddresses = (callback, limit) => {
  Address.find(callback).limit(limit);
}
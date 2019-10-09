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
    required: false,
    id: {
      type: String,
      required: true
    },
    ip: {
      type: String,
      required: true
    }
  },
  date: {
    type: Date,
    default: Date.now
  }
});

let Customer = module.exports = mongoose.model('customers', CustomerSchema);

// get customers
module.exports.getCustomers = (callback, limit) => {
  Customer.find(callback).limit(limit);
}

// get customer
module.exports.getCustomerByName = (name, callback) => {
  let query = {name: name};
  Customer.find(query, callback);
}

// add customer
module.exports.addCustomer = (customer, callback) => {
  Customer.create(customer, callback);
}

// update customer
module.exports.updateCustomer = (id, update, options, callback) => {
  let query = {_id: id};
  Customer.findOneAndUpdate(query, update, options, callback);
}

// remove customer
module.exports.deleteCustomer = (id, callback) => {
  let query = {_id: id};
  Customer.deleteOne(query, callback);
}
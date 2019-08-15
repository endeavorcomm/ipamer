document.addEventListener('DOMContentLoaded', function() {
  // initialize modal trigger
  var modal = document.getElementById('assign-address');
  M.Modal.init(modal);

  // initialize address-add customer field autocomplete
  var customerAuto = document.getElementById('address-customer');
  M.Autocomplete.init(customerAuto);

  // initialize tooltips
  var tooltips = document.querySelectorAll('.tooltipped');
  M.Tooltip.init(tooltips);

  // add event listener to address-assign close button
  const assignCustomerClose = document.getElementById('assignCustomerClose');
  assignCustomerClose.addEventListener('click', function(e) {
    document.getElementById('assign-address').style.display = 'none';
  });

  // add event listener to address-unassign close button
  const unassignCustomerClose = document.getElementById('unassignCustomerClose');
  unassignCustomerClose.addEventListener('click', function(e) {
    document.getElementById('unassign-address').style.display = 'none';
  });

  // add event listenters to address action icons
  const assignEls = document.querySelectorAll('.assignCustomer');
  assignEls.forEach(function (edit) {
    edit.addEventListener('click', function(e){
      const id = e.target.id;
      // TODO get ip address for popupbox with event bubbling to parent

      var customerName = document.getElementById(`id-${id}`).innerHTML;
      
      if(customerName !== '') {
        // customer already assigned
        M.toast({html: 'Address already assigned'})
      } else {
        // assign the database id, of the ip address, to this hidden input field's value
        document.getElementById('addressID').value = id;
        // assign this text to the header of the popup box
        //document.getElementById('assignIPHeader').textContent = `Assign Customer to IP`;
        // show the popup box
        document.getElementById('assign-address').style.display = 'block';
      }

      e.preventDefault();
    });
  });

  const unassignEls = document.querySelectorAll('.unassignCustomer');
  unassignEls.forEach(function (edit) {
    edit.addEventListener('click', function(e){
      // TODO get ip address for popupbox with event bubbling to parent
      const id = e.target.id;
      var uncustomerName = document.getElementById(`id-${id}`).innerHTML;

      if(uncustomerName == '') {
        // no customer assigned
        M.toast({html: 'Address not assigned'})
      } else {
        document.getElementById('unaddressID').value = id;
        document.getElementById('uncustomer').value = uncustomerName;
        //document.getElementById('unassignIPHeader').textContent = `Unassign Customer from IP`;
        document.getElementById('unassign-address').style.display = 'block';
      }

      e.preventDefault();
    });
  });

  // create ajax request and get a list of customer names when adding an IP address
  var xhrCustomer = new XMLHttpRequest();
  xhrCustomer.open('GET', 'http://localhost/getCustomers', true);
  xhrCustomer.send();
  xhrCustomer.onreadystatechange = () => {
    if (xhrCustomer.readyState === 4) {
      if (xhrCustomer.status === 200) {
        // convert response string into an object
        var responseCustomers = JSON.parse(xhrCustomer.responseText);

        // manipulate object data into usable format for autocomplete
        var customers = {};
        for (var i=0; i<responseCustomers.length; i++) {
          // take customer string and convert it to a key, with null as the value
          customers[responseCustomers[i].name] = null;
        }

        // update autocomplete data
        let customerInstance = M.Autocomplete.getInstance(customerAuto);
        customerInstance.updateData(customers);
      } else {
        console.log('Error with ajax request');
      }
    }
  }
});
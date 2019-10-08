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

  // check for cookies
  let theCookies = document.cookie.split(';');
  theCookies.forEach(cookie => {
    let parseCookie = cookie.split('=');
    if (parseCookie[0] == 'IPAMerStatus') {
      // replace all %20s in string with a space
      parseCookie[1] = parseCookie[1].replace(/%20/g, ' ');
      M.toast({html: `${parseCookie[1]}`});
      // expire cookie
      document.cookie = "IPAMerStatus=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  });

  // add event listener to address-assign cancel button
  const assignCustomerCancel = document.getElementById('assignCustomerCancel');
  assignCustomerCancel.addEventListener('click', function(e) {
    document.getElementById('assign-address').style.display = 'none';
  });

  // add event listener to address-unassign cancel button
  const unassignCustomerCancel = document.getElementById('unassignCustomerCancel');
  unassignCustomerCancel.addEventListener('click', function(e) {
    document.getElementById('unassign-address').style.display = 'none';
  });

  // add event listenter to edit prefix button
  document.getElementById('editPrefixBtn').addEventListener('click', function(e){

    // show the popup box
    document.getElementById('edit-prefix').style.display = 'block';

    e.preventDefault();
  });

  // add event listener to edit prefix cancel button
  const editPrefixCancel = document.getElementById('editPrefixCancel');
  editPrefixCancel.addEventListener('click', function(e) {
    document.getElementById('edit-prefix').style.display = 'none';
  });

  // add event listenter to delete prefix button
  document.getElementById('deletePrefixBtn').addEventListener('click', function(e){

    // show the popup box
    document.getElementById('delete-prefix').style.display = 'block';

    e.preventDefault();
  });

  // add event listener to delete prefix cancel button
  const deletePrefixCancel = document.getElementById('deletePrefixCancel');
  deletePrefixCancel.addEventListener('click', function(e) {
    document.getElementById('delete-prefix').style.display = 'none';
  });

  // add event listenters to address action icons
  const assignEls = document.querySelectorAll('.assignCustomer');
  assignEls.forEach(function (edit) {
    edit.addEventListener('click', function(e){
      const id = e.target.id;
      // TODO get ip address for popupbox header with event bubbling to parent

      let customerName = document.getElementById(`name-${id}`).innerHTML;
      
      if(customerName !== '') {
        // customer already assigned
        M.toast({html: 'Address already assigned'});
      } else {
        // assign the database id, of the ip address, to this hidden input field's value
        document.getElementById('addressID').value = id;
        // show the popup box
        document.getElementById('assign-address').style.display = 'block';
      }

      e.preventDefault();
    });
  });

  const unassignEls = document.querySelectorAll('.unassignCustomer');
  unassignEls.forEach(function (edit) {
    edit.addEventListener('click', function(e){
      // TODO get ip address for popupbox header with event bubbling to parent
      const id = e.target.id;
      let uncustomerName = document.getElementById(`name-${id}`).innerHTML;
      let unaddressIP = document.getElementById(`ip-${id}`).innerHTML;

      if(uncustomerName == '') {
        // no customer assigned
        M.toast({html: 'Address not assigned'});
      } else {
        document.getElementById('unaddressID').value = id;
        document.getElementById('uncustomer').value = uncustomerName;
        document.getElementById('unaddressIP').value = unaddressIP;
        document.getElementById('unassign-address').style.display = 'block';
      }

      e.preventDefault();
    });
  });

  // create ajax request and get a list of customer names when adding an IP address
  var xhrCustomer = new XMLHttpRequest();
  xhrCustomer.open('GET', '/getCustomers', true);
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
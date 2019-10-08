document.addEventListener('DOMContentLoaded', function() {

  // initialize tooltips
  var tooltips = document.querySelectorAll('.tooltipped');
  M.Tooltip.init(tooltips);

  // // check for cookies
  // let theCookies = document.cookie.split(';');
  // theCookies.forEach(cookie => {
  //   let parseCookie = cookie.split('=');
  //   if (parseCookie[0] == 'IPAMerStatus') {
  //     // replace all %20s in string with a space
  //     parseCookie[1] = parseCookie[1].replace(/%20/g, ' ');
  //     M.toast({html: `${parseCookie[1]}`});
  //     // expire cookie
  //     document.cookie = "IPAMerStatus=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  //   }
  // });

  // initialize address-assign IP field autocomplete
  var ipAuto = document.getElementById('customer-address');
  M.Autocomplete.init(ipAuto);

  // add event listener to assign address cancel button
  const assignIPCancel = document.getElementById('assignIPCancel');
  assignIPCancel.addEventListener('click', function(e) {
    document.getElementById('assign-address').style.display = 'none';
  });

  // add event listener to address-unassign cancel button
  const unassignCustomerCancel = document.getElementById('unassignCustomerCancel');
  unassignCustomerCancel.addEventListener('click', function(e) {
    document.getElementById('unassign-address').style.display = 'none';
  });

  // add event listenters to assign address button
  document.getElementById('assignCustomerBtn').addEventListener('click', function(e){
    const customerName = document.querySelector('.customerName').innerHTML;
    document.getElementById('customer').value = customerName;

    // show the popup box
    document.getElementById('assign-address').style.display = 'block';

    e.preventDefault();
  });

  // add event listenter to delete customer button
  document.getElementById('deleteCustomerBtn').addEventListener('click', function(e){

    // show the popup box
    document.getElementById('delete-customer').style.display = 'block';

    e.preventDefault();
  });

  // add event listener to delete customer cancel button
  const deleteCustomerCancel = document.getElementById('deleteCustomerCancel');
  deleteCustomerCancel.addEventListener('click', function(e) {
    document.getElementById('delete-customer').style.display = 'none';
  });

  // add event listenter to edit customer button
  document.getElementById('editCustomerBtn').addEventListener('click', function(e){

    // show the popup box
    document.getElementById('edit-customer').style.display = 'block';

    e.preventDefault();
  });

  // add event listener to edit customer cancel button
  const editCustomerCancel = document.getElementById('editCustomerCancel');
  editCustomerCancel.addEventListener('click', function(e) {
    document.getElementById('edit-customer').style.display = 'none';
  });

  // add event listenters to address action icons
  const unassignEls = document.querySelectorAll('.unassignIP');
  unassignEls.forEach(function (edit) {
    edit.addEventListener('click', function(e){
      // TODO get ip address for popupbox header with event bubbling to parent
      const id = e.target.id;
      const uncustomerName = document.querySelector('.customerName').innerHTML;
      const unIP = document.getElementById(`ip-${id}`).innerHTML;

      document.getElementById('unaddressID').value = id;
      document.getElementById('unaddressIP').value = unIP;
      document.getElementById('uncustomer').value = uncustomerName;
      //document.getElementById('unassignIPHeader').textContent = `Unassign Customer from IP`;
      document.getElementById('unassign-address').style.display = 'block';

      e.preventDefault();
    });
  });

  // create ajax request and get a list of IPs when assigning to a customer
  var xhrIP = new XMLHttpRequest();
  xhrIP.open('GET', 'http://localhost/getAvailAddresses', true);
  xhrIP.send();
  xhrIP.onreadystatechange = () => {
    if (xhrIP.readyState === 4) {
      if (xhrIP.status === 200) {
        // convert response string into an object
        var responseIP = JSON.parse(xhrIP.responseText);

        // manipulate object data into usable format for autocomplete
        var ips = {};
        for (var i=0; i<responseIP.length; i++) {
          // take IP address and convert it to a key, with null as the value
          ips[responseIP[i].ip] = null;
        }

        // update autocomplete data
        let ipInstance = M.Autocomplete.getInstance(ipAuto);
        ipInstance.updateData(ips);
      } else {
        console.log('Error with ajax request');
      }
    }
  }
});
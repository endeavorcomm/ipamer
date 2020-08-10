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

  // add event listenter to edit address button
  document.getElementById('editAddressBtn').addEventListener('click', function(e){

    // show the popup box
    document.getElementById('edit-address').style.display = 'block';

    e.preventDefault();
  });

  // add event listener to edit address cancel button
  const editAddressCancel = document.getElementById('editAddressCancel');
  editAddressCancel.addEventListener('click', function(e) {
    document.getElementById('edit-address').style.display = 'none';
  });

  const unassignEls = document.querySelectorAll('.unassignCustomer');
  unassignEls.forEach(function (edit) {
    edit.addEventListener('click', function(e){
      const id = e.target.id;
      document.getElementById('unaddressID').value = id;
      document.getElementById('unassign-address').style.display = 'block';
      e.preventDefault();
    });
  });
});
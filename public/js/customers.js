document.addEventListener('DOMContentLoaded', function() {

  // initialize tooltips
  var tooltips = document.querySelectorAll('.tooltipped');
  M.Tooltip.init(tooltips);

  // add event listener to address-unassign cancel button
  const unassignCustomerCancel = document.getElementById('unassignCustomerCancel');
  unassignCustomerCancel.addEventListener('click', function(e) {
    document.getElementById('unassign-address').style.display = 'none';
  });

  // add event listener to delete customer button
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
      document.getElementById('unassign-address').style.display = 'block';

      e.preventDefault();
    });
  });
});
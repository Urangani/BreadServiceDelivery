# TODO List for Delivery System Enhancements

## Completed Tasks
- [x] Remove Google Sign-In from login page (index.html, src/js/index.js)
- [x] Update src/student.html: Add IDs to payment form fields for easier access
- [x] Update src/js/student.js: Modify handlePayment function to extract and store payment method, delivery address, and special instructions in Firebase
- [x] Add basic validation for required fields (payment method, delivery address)
- [x] Implement payment confirmation step (e.g., confirm dialog with order summary)
- [x] Add 'driver' role to user management in admin.js and admin.html
- [x] Update admin.js to allow assigning drivers to deliveries
- [x] Create src/driver.html and src/js/driver.js for driver portal
- [x] Allow drivers to mark deliveries as completed (sets order status to 'delivered')
- [x] Update student.js to allow students to confirm receipt of delivered orders (sets order to 'completed')

## Pending Tasks
- [ ] Test the enhanced delivery flow: assign driver, driver marks delivered, student confirms receipt
- [ ] Add notifications or status updates for better UX (optional)

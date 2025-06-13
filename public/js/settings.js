document.addEventListener('DOMContentLoaded', function() {
    const eraseButton = document.getElementById('eraseButton');
    const phoneForm = document.getElementById('phoneForm');
    const phoneNumberInput = document.getElementById('phoneNumber');

    eraseButton.addEventListener('click', function(event) {
        phoneNumberInput.value = 'null';  // Set the phone number to 'null' string
        phoneForm.submit();  // Submit the form after setting the value
    });
});
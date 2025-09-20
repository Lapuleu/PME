document.addEventListener('DOMContentLoaded', function() {
    const myForm = document.getElementById('new-pswd-form');
    myForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission
        const formData = new FormData(myForm);
        const newPlabel = formData.get("pLabel");
        const newPassword = formData.get("password");
        console.log(newPlabel + ": "+ newPassword);
    });
});
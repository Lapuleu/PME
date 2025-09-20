document.addEventListener('DOMContentLoaded', function() {
    const myForm = document.getElementById('new-pswd-form');
    const savedPasswordsList = document.getElementById('saved-passwords');
    myForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(myForm);
        const newPlabel = formData.get("pLabel");
        const newPassword = formData.get("password");
        savedPasswordsList.innerHTML += `<li>${newPlabel} <button class="delete-button">Delete</button></li>`;  
        // Call Wolfram Cloud API for SHA-256 hash
        fetch('https://www.wolframcloud.com/obj/silversharkan/sha256hash' + encodeURIComponent(newPassword))
            .then(response => response.text())
            .then(hash => {
                console.log(newPlabel + ": " + hash);
                // You can now store the hash as needed
            })
            .catch(error => {
                console.error('Error calling Wolfram API:', error);
            });
    });
    savedPasswordsList.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-button')) {
            const listItem = event.target.closest('li');
            listItem.remove();
        }
    });
});
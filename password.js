document.addEventListener('DOMContentLoaded', function() {
    const myForm = document.getElementById('new-pswd-form');
    const savedPasswordsList = document.getElementById('saved-passwords');
    myForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(myForm);
        const newPlabel = formData.get("pLabel");
        const newPassword = formData.get("password");
        // Call Wolfram Cloud API for SHA-256 hash
        fetch('http://localhost:3000/sha256hash?input=' + encodeURIComponent(newPassword))
            .then(response => response.text())
            .then(hash => {
                savedPasswordsList.innerHTML += `<li>${newPlabel}: ${hash} <button class="delete-button">Delete</button></li>`;
                console.log(newPlabel + ": " + hash);
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
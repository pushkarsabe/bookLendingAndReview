
console.log('login.js loaded');
// const HOST = 'localhost';
const HOST = '';

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    console.log('HOST = ' + HOST);
    console.log('Submit event triggered');
    submitData();
});
document.getElementById('signupBtn').addEventListener('click', function () {
    window.location.href = './signup.html';
});

//function to display the message
function showMessage(msgText, className) {
    return new Promise(resolve => {
        const msg = document.getElementById('message');
        const div = document.createElement('div');
        const textNode = document.createTextNode(msgText);
        div.appendChild(textNode);
        msg.appendChild(div);
        msg.classList.add(className);

        setTimeout(() => {
            msg.classList.remove(className);
            msg.removeChild(div);
            resolve();
        }, 2000);
    })
}

async function submitData() {
    // event.preventDefault();
    console.log('inside submitData login');
    // Get values from the form
    const email = document.getElementById('inputEmail').value;
    const password = document.getElementById('inputPassword').value;
    console.log('HOST = ', HOST);
    console.log('email = ', email);
    console.log('password = ', password);

    if (email == "" || password == "") {
        console.log("Empty user fields");
        await showMessage('Data is missing', 'failureMessage');
    }
    else {
        const obj = {
            email: email,
            password: password
        }

        try {
            // const response = await axios.post(`http://${HOST}:3000/api/users/login`, obj);
            const response = await axios.post(`${HOST}:3000/api/users/login`, obj);
            console.log('response data = ', response.data);

            const { token, userData } = response.data;

            console.log('user = ', userData);
            console.log('token = ', token);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(userData));

            await showMessage('Email and Password verified', 'succesMessage');

            // Check the isAdmin flag from the user data we just received
            setTimeout(() => {
                if (userData && userData.isAdmin) {
                    console.log('Admin user detected, redirecting to admin panel.');
                    window.location.href = './admin.html';
                }
                else {
                    console.log('Regular user detected, redirecting to home page.');
                    window.location.href = './sparkHome.html';
                }
            }, 1000);// Wait 1 second for the message to display
        }
        catch (error) {
            console.log('error = ', error);
            let errorMessage = 'An unexpected error occurred.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.request) {
                errorMessage = 'No response from server. Please check your connection.';
            }
            await showMessage(errorMessage, 'failureMessage');
        }
    }
    //to clear the fields
    document.getElementById('inputEmail').value = "";
    document.getElementById('inputPassword').value = "";
}//submitData

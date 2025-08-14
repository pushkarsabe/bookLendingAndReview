console.log('Admin script loaded.');
// const HOST = 'http://localhost:3000'; // Change this to your actual host URL
const HOST = 'https://book-lending-and-review.onrender.com';


function decodeJwt(token) {
    try {
        // Split the token into its three parts: header, payload, and signature
        const base64Url = token.split('.')[1];

        // Replace URL-safe characters with Base64 standard characters
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        // Return null if the token is invalid or an error occurs
        console.error("Failed to decode JWT:", e);
        return null;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            console.log('Signing out...');
            // Remove JWT from local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to the login page
            window.location.href = '/index.html';
        });
    }

    // Check if the user is logged in and is an admin   
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    console.log('User:', user);

    // This check reads the `isAdmin` flag you added to localStorage.
    // If the user isn't an admin, it redirects them immediately.
    if (!token || !user || !user.isAdmin) {
        alert('Access Denied. You are not an administrator.');
        window.location.href = './sparkHome.html';
        return;
    }
    let decodedToken = decodeJwt(token);
    console.log('Decoded Token:', decodedToken);

    const addBookForm = document.getElementById('addBookForm');
    const bookListContainer = document.getElementById('bookListContainer');
    const returnRequestsContainer = document.getElementById('returnRequestsContainer');

    async function fetchAndDisplayReturnRequests() {
        try {
            // const response = await axios.get(`http://${HOST}:3000/api/lendings/admin/pending-returns`, {
            //     headers: {
            //         'Authorization': `Bearer ${token}`
            //     }
            // });
            const response = await axios.get(`${HOST}/api/lendings/admin/pending-returns`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Return requests fetched:', response.data);

            renderReturnRequests(response.data);
        } catch (error) {
            returnRequestsContainer.innerHTML = "<p>Could not load return requests.</p>";
        }
    }// fetchAndDisplayReturnRequests

    function renderReturnRequests(requests) {
        console.log('Rendering return requests:', requests);

        if (requests.length === 0) {
            returnRequestsContainer.innerHTML = "<p>No pending return requests.</p>";
            return;
        }
        returnRequestsContainer.innerHTML = '<ul></ul>';
        const list = returnRequestsContainer.querySelector('ul');
        requests.forEach(req => {
            const item = document.createElement('li');
            item.className = 'admin-book-item';
            item.innerHTML = `
                <span><strong>${req.Book.title}</strong> (User: ${req.User.name})</span>
                <div class="admin-actions">
                    <button class="btn-approve" data-lending-id="${req.lending_id}">Approve</button>
                    <button class="btn-reject" data-lending-id="${req.lending_id}">Reject</button>
                </div>
            `;
            list.appendChild(item);
        });
    }

    async function processBookReturn(lendingId, action) {
        console.log(`Processing return request ${lendingId} with action: ${action}`);

        try {
            // const response = await axios.put(`http://${HOST}:3000/api/lendings/admin/process-return/${lendingId}`,
            //     { action: action },
            //     { headers: { 'Authorization': `Bearer ${token}` } }
            // );
            const response = await axios.put(`${HOST}/api/lendings/admin/process-return/${lendingId}`,
                { action: action },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            console.log('Return request processed:', response.data);

            alert(response.data.message);

            fetchAndDisplayReturnRequests(); // Refresh the list of requests
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to process request.');
        }
    }// processBookReturn

    // --- NEW: Event Listener for the requests container ---
    returnRequestsContainer.addEventListener('click', (e) => {
        const lendingId = e.target.dataset.lendingId;
        if (!lendingId) return;

        if (e.target.classList.contains('btn-approve')) {
            processBookReturn(lendingId, 'approve');
        } else if (e.target.classList.contains('btn-reject')) {
            processBookReturn(lendingId, 'reject');
        }
    });


    // --- Fetch and Display All Books ---
    async function fetchAndDisplayBooks() {
        try {
            // const response = await axios.get('http://${HOST}:3000/api/books/', {
            //     headers: { 'Authorization': `Bearer ${token}` }
            // }); 
            const response = await axios.get(`${HOST}/api/books/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Books fetched:', response.data.books);

            renderBookList(response.data.books);

        } catch (error) {
            console.error('Failed to fetch books:', error);
            bookListContainer.innerHTML = '<p>Error loading books.</p>';
        }
    }//fetchAndDisplayBooks

    function renderBookList(books) {
        bookListContainer.innerHTML = '<ul></ul>';
        const list = bookListContainer.querySelector('ul');
        if (!list) return;

        books.forEach(book => {
            const bookElement = document.createElement('li');
            bookElement.className = 'admin-book-item';
            bookElement.innerHTML = `
            <span><strong>${book.title}</strong> by ${book.author}</span>
            <button class="btn-delete" data-book-id="${book.book_id}">Delete</button>
            `;
            list.appendChild(bookElement);
        });
    }// renderBookList

    // --- Handle Add Book Form Submission ---
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookData = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            genre: document.getElementById('genre').value,
            description: document.getElementById('description').value,
        };
        try {
            // let res = await axios.post('http://${HOST}:3000/api/books/', bookData, {
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            let res = await axios.post(`${HOST}/api/books/`, bookData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Book added:', res.data);

            alert('Book added successfully!');

            addBookForm.reset();
            fetchAndDisplayBooks(); // Refresh list

        } catch (error) {
            alert('Failed to add book. ' + (error.response?.data?.message || 'Check console for details.'));
        }
    });// addBookForm

    // --- Handle Delete Button Clicks ---
    bookListContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const bookId = e.target.dataset.bookId;
            if (confirm(`Are you sure you want to delete this book (ID: ${bookId})?`)) {
                try {
                    // let res = await axios.delete(`http://${HOST}:3000/api/books/${bookId}`, {
                    //     headers: { 'Authorization': `Bearer ${token}` }
                    // });
                    let res = await axios.delete(`${HOST}/api/books/${bookId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    console.log('Book deleted:', res.data);

                    alert('Book deleted successfully!');

                    fetchAndDisplayBooks(); // Refresh list

                } catch (error) {
                    alert('Failed to delete book. ' + (error.response?.data?.message || 'Check console for details.'));
                }
            }
        }
    });// bookListContainer

    // Initial load
    fetchAndDisplayBooks();
    fetchAndDisplayReturnRequests(); // Fetch the new data

});//DOMContentLoaded
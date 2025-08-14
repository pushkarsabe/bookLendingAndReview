console.log('sparkHome.js loaded');
const HOST = 'http://localhost:3000';    
// const HOST = 'https://book-lending-and-review.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const booksGrid = document.getElementById('booksGrid');
    const searchInput = document.getElementById('searchInput');
    const profileIcon = document.getElementById('signOutBtn');
    const myBooksGrid = document.getElementById('myBooksGrid');

    let allBooks = []; // To store all fetched books

    if (!token) {
        window.location.href = './index.html';
        return;
    }
    fetchAndDisplayBooks();
    fetchAndDisplayMyBooks();

    profileIcon.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = './index.html';
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredBooks = allBooks.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)
        );
        displayBooks(filteredBooks);
    });

    // 4. Fetch books from API
    async function fetchAndDisplayBooks() {
        try {
            let token = localStorage.getItem('token');
            console.log('Fetching books with token:', token);
            if (!token) {
                console.error('No token found, redirecting to login.');
                window.location.href = './index.html';
                return;
            }

            // const response = await axios.get(`http://${HOST}:3000/api/books/`, {
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            const response = await axios.get(`${HOST}/api/books/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Books fetched successfully:', response.data);
            booksGrid.innerHTML = ''; // Clear existing content

            allBooks = response.data.books;
            displayBooks(allBooks);
        } catch (error) {
            console.error('Failed to fetch books:', error);
            booksGrid.innerHTML = '<p class="error-message">Failed to load books. Please try again later.</p>';
            if (error.response && error.response.status === 401) {
                // If token is invalid, redirect to login
                localStorage.removeItem('token');
                window.location.href = './index.html';
            }
        }
    }

    function displayBooks(books) {
        booksGrid.innerHTML = '';
        if (books.length === 0) {
            booksGrid.innerHTML = '<p>No books found in the library.</p>';
            return;
        }

        books.forEach((book, index) => {
            const isAvailable = book.status === 'available';
            const card = document.createElement('div');
            card.className = 'book-card'; // No longer needs 'clickable' class
            card.style.animationDelay = `${index * 50}ms`;

            // ADDED THE CARD FOOTER BACK WITH STATUS AND BUTTON
            card.innerHTML = `
                <div class="card-content">
                    <h3>${book.title}</h3>
                    <p class="author">by ${book.author}</p>
                    <p class="genre">${book.genre}</p>
                </div>
                <div class="card-footer">
                    <span class="status" data-status="${book.status}">${book.status.charAt(0).toUpperCase() + book.status.slice(1)}</span>
                    <button class="borrow-btn" data-book-id="${book.book_id}" ${!isAvailable ? 'disabled' : ''}>
                        ${isAvailable ? 'Borrow' : 'Unavailable'}
                    </button>
                </div>
            `;
            booksGrid.appendChild(card);
        });
    }

    // Click listener for the main library grid
    booksGrid.addEventListener('click', async (e) => {
        // Check if the clicked element is a borrow button and is not disabled
        if (e.target.classList.contains('borrow-btn') && !e.target.disabled) {
            if (window.confirm('Are you sure you want to borrow this book?')) {
                const bookId = e.target.dataset.bookId;
                await borrowBook(bookId, e.target);
            }
        }
    });


    // Helper function for borrowing
    async function borrowBook(bookId, cardElement) {
        cardElement.style.opacity = '0.5';
        try {
            // await axios.post(`http://${HOST}:3000/api/lendings/borrow`, { book_id: bookId }, {
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            await axios.post(`${HOST}/api/lendings/borrow`, { book_id: bookId }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Book borrowed successfully! It will now appear in your "My Books" section.');
            fetchAndDisplayBooks(); // Refresh main library
            fetchAndDisplayMyBooks(); // Refresh user's library
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to borrow book.');
            cardElement.style.opacity = '1';
        }
    }

    // Fetch and display user's borrowed books ---
    async function fetchAndDisplayMyBooks() {
        console.log('Fetching my books :');
        try {
            let token = localStorage.getItem('token');
            console.log('Fetching my books with token:', token);
            if (!token) {
                console.error('No token found, redirecting to login.');
                window.location.href = './index.html';
                return;
            }
            myBooksGrid.innerHTML = ''; // Clear existing content

            // Fetch user's borrowed books
            // const response = await axios.get(`http://${HOST}:3000/api/lendings`, {
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            const response = await axios.get(`${HOST}/api/lendings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            displayMyBooks(response.data);
        } catch (error) {
            console.error('Failed to fetch my books:', error);
            myBooksGrid.innerHTML = '<p>Could not load your books.</p>';
        }
    }


    // --- NEW: Render cards for "My Books" grid ---
    function displayMyBooks(lendings) {
        myBooksGrid.innerHTML = '';
        if (lendings.length === 0) {
            myBooksGrid.innerHTML = '<p>You have not borrowed any books yet.</p>';
            return;
        }

        lendings.forEach(lending => {
            const card = document.createElement('div');
            card.className = 'my-book-card';
            // Store the LENDING ID to pass to the detail page
            card.dataset.lendingId = lending.lending_id;

            card.innerHTML = `
                <h4>${lending.Book.title}</h4>
                <span class="genre">${lending.Book.genre}</span>
            `;
            myBooksGrid.appendChild(card);
        });
    }


    // --- NEW: Click listener for "My Books" grid ---
    myBooksGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.my-book-card');
        if (card) {
            const lendingId = card.dataset.lendingId;
            // Navigate to the new detail page with the lending ID
            window.location.href = `./book.html?lendingId=${lendingId}`;
        }
    });


});//domContentLoaded
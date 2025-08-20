console.log('sparkHome.js loaded');
// const HOST = 'http://localhost:3000';
const HOST = 'https://book-lending-and-review.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const booksGrid = document.getElementById('booksGrid');
    const searchInput = document.getElementById('searchInput');
    const profileIcon = document.getElementById('signOutBtn');
    const myBooksGrid = document.getElementById('myBooksGrid');
    const overdueBooksGrid = document.getElementById('overdueBooksGrid');

    let allBooks = []; // To store all fetched books  

    if (!token) {
        window.location.href = './index.html';
        return;
    }
    fetchAndDisplayBooks();
    fetchAndDisplayMyBooks();
    fetchAndDisplayOverdueBooks();

    profileIcon.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
            const bookId = e.target.dataset.bookId;
            const bookTitle = e.target.closest('.book-card').querySelector('h3').innerText;
            const price = 2000; // Example price will be : ₹200

            await borrowBook(bookId, bookTitle, price);
        }
    });


    // Helper function for borrowing
    async function borrowBook(bookId, bookTitle, price) {
        console.log('Borrowing book with ID:', bookId, 'for', price);

        try {
            const orderResponse = await axios.post(`${HOST}/api/payments/create-order`,
                {
                    amount: price,
                    currency: 'INR',
                    bookId: bookId
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            const order = orderResponse.data;
            console.log('order = ', order);

            const user = JSON.parse(localStorage.getItem('user'));
            console.log('user = ', user);

            const options = {
                "key": "rzp_test_lWJc1uOOOqiLsL", // Enter the Key ID generated from the Dashboard
                "amount": order.amount,
                "currency": "INR",
                "name": "Spark Library",
                "description": `Borrow: ${bookTitle}`,
                "order_id": order.id,
                "handler": async function (response) {
                    // 3. This function handles the successful payment
                    try {
                        await axios.post(`${HOST}/api/payments/verify-payment`, {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            book_id: bookId,
                            user_id: user.id
                        }, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });

                        alert('Book borrowed successfully! It will now appear in your "My Books" section.');
                        // Refresh the book lists
                        fetchAndDisplayBooks();
                        fetchAndDisplayMyBooks();
                    } catch (verifyError) {
                        console.error("Payment verification failed:", verifyError);
                        alert("Payment successful, but verification failed. Please contact support.");
                    }
                },
                "prefill": {
                    "name": user.name,
                    "email": user.email, // Use the user's email if available
                },
                "theme": {
                    "color": "#3399cc"
                }
            };
            console.log('options = ', options);

            const rzp = new Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Payment initiation error:", error);
            alert('Failed to initiate payment. Check the console for details.');
        }
    }//borrowBook


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


    myBooksGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.my-book-card');
        if (card) {
            const lendingId = card.dataset.lendingId;
            // Navigate to the new detail page with the lending ID
            window.location.href = `./book.html?lendingId=${lendingId}`;
        }
    });


    async function fetchAndDisplayOverdueBooks() {
        console.log('Fetching overdue books');
        try {
            let token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            overdueBooksGrid.innerHTML = '';

            const response = await axios.get(`${HOST}/api/lendings/overdue`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('Overdue books fetched successfully:', response.data);

            if (response.data.length === 0) {
                overdueBooksGrid.innerHTML = '<p>You have no overdue books.</p>';
                return;
            }

            displayOverdueBooks(response.data);
        } catch (error) {
            console.error('Failed to fetch overdue books:', error);
            overdueBooksGrid.innerHTML = '<p>Could not load your overdue books.</p>';
        }
    }//fetchAndDisplayOverdueBooks

    function displayOverdueBooks(lendings) {
        console.log('Displaying overdue books:', lendings);

        overdueBooksGrid.innerHTML = '';
        if (lendings.length === 0) {
            overdueBooksGrid.innerHTML = '<p>You have no overdue books.</p>';
            return;
        }

        lendings.forEach(lending => {
            const card = document.createElement('div');
            card.className = 'my-book-card overdue'; // Add a class for styling
            card.dataset.lendingId = lending.lending_id;

            card.innerHTML = `
                <h4>${lending.Book.title}</h4>
                <span class="genre">${new Date(lending.due_date).toLocaleDateString()}</span>
            `;
            overdueBooksGrid.appendChild(card);
        });
    }// displayOverdueBooks

    overdueBooksGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.my-book-card');
        if (card) {
            const lendingId = card.dataset.lendingId;
            window.location.href = `./book.html?lendingId=${lendingId}`;
        }
    });


});//domContentLoaded
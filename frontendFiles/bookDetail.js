console.log('bookDetail.js loaded');
// const HOST = 'localhost';
const HOST = 'https://book-lending-and-review.onrender.com/';

document.addEventListener('DOMContentLoaded', () => {

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const authToken = localStorage.getItem('token');
    console.log('Current user:', currentUser);
    console.log('Auth token:', authToken);

    if (!authToken || !currentUser) {
        console.warn('User not authenticated. Redirecting to login page.');
        window.location.href = './index.html';
        return;
    }

    const profileIcon = document.getElementById('profileIcon');

    profileIcon.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = './index.html';
    });

    const urlParams = new URLSearchParams(window.location.search);
    const lendingId = urlParams.get('lendingId');
    console.log('Lending ID from URL:', lendingId);
    let actualBookId;

    const bookDetailContainer = document.getElementById('bookDetailContainer');
    const userReviewArea = document.getElementById('user-review-area');
    const otherReviewsList = document.getElementById('other-reviews-list');

    if (!lendingId) {
        bookDetailContainer.innerHTML = `<p style="color:red;">Error: No lending record specified in the URL.</p>`;
        return;
    }

    async function fetchLendingDetails() {
        try {
            // const response = await axios.get(`http://${HOST}:3000/api/lendings/${lendingId}`, {
            //     headers: { 'Authorization': `Bearer ${authToken}` }
            // });
            const response = await axios.get(`${HOST}:3000/api/lendings/${lendingId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const lendingData = response.data;
            console.log('Lending data:', lendingData);

            actualBookId = lendingData.Book.book_id;
            console.log('Actual Book ID:', actualBookId);

            renderBookAndLendingDetails(lendingData);
            fetchReviews();
        } catch (error) {
            console.error('Failed to fetch lending details:', error);
            bookDetailContainer.innerHTML = `<p style="color:red;">Could not load book details.</p>`;
        }
    }

    // --- CHANGE 1: ADD THE NEW FUNCTION TO REQUEST AN EXTENSION ---
    async function requestExtension() {
        if (!confirm('Are you sure you want to request a 7-day extension?')) {
            return;
        }
        try {
            // const response = await axios.put(`http://${HOST}:3000/api/lendings/extend/${lendingId}`, {}, {
            //     headers: { 'Authorization': `Bearer ${authToken}` }
            // });
            const response = await axios.put(`${HOST}:3000/api/lendings/extend/${lendingId}`, {}, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            console.log('Extension response:', response.data);
            alert(response.data.message);
            // Refresh the details to show the new due date
            fetchLendingDetails();
        } catch (error) {
            console.error('Failed to request extension:', error);
            alert(error.response?.data?.message || 'An error occurred while requesting the extension.');
        }
    }

    function renderBookAndLendingDetails(lending) {
        console.log('Rendering book and lending details:', lending);

        const dueDate = new Date(lending.due_date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const book = lending.Book;

        bookDetailContainer.innerHTML = `
            <h1>${book.title}</h1>
            <h2 class="author">by ${book.author}</h2>
            <p class="description">${book.genre || 'No genre available.'}</p>
            
            <div class="lending-info">
                <p class="status">Status: <strong>${book.status !== 'available' ? 'On Loan' : 'Available'}</strong></p>
                <p class="due-date">Due Date: <strong>${dueDate}</strong></p>
                
                ${!lending.returned_date ? `<button id="extend-btn" class="btn btn-secondary">Extend by 7 Days</button>` : ''}
            </div>
        `;

        // --- CHANGE 3: ADD THE EVENT LISTENER FOR THE NEW BUTTON ---
        // We must do this *after* setting the innerHTML
        const extendButton = document.getElementById('extend-btn');
        if (extendButton) {
            extendButton.addEventListener('click', requestExtension);
        }
    }

    // ... No changes needed to the rest of your functions ...
    // (fetchReviews, postReview, renderReviewSection, etc.)
    async function fetchReviews() {
        if (!actualBookId) return;
        try {
            // const response = await axios.get(`http://${HOST}:3000/api/books/${actualBookId}/reviews`, {
            //     headers: { 'Authorization': `Bearer ${authToken}` }
            // });
            const response = await axios.get(`${HOST}:3000/api/books/${actualBookId}/reviews`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            console.log('Fetched reviews:', response.data);

            renderReviewSection(response.data.data);

        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            otherReviewsList.innerHTML = `<p style="color:red;">Could not load reviews.</p>`;
        }
    }

    async function postReview(reviewText) {
        console.log('Posting review:', reviewText);

        if (!actualBookId) return;
        try {
            // await axios.post(`http://${HOST}:3000/api/books/${actualBookId}/review`,
            //     { comment: reviewText },
            //     { headers: { 'Authorization': `Bearer ${authToken}` } }
            // );
            await axios.post(`${HOST}:3000/api/books/${actualBookId}/review`,
                { comment: reviewText },
                { headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            alert('Review saved successfully!');
            fetchReviews();
        } catch (error) {
            console.error('Error saving review:', error);
            alert('Error saving review. Please try again.');
        }
    }

    function renderReviewSection(reviews) {
        console.log('Rendering reviews:', reviews);

        const userReview = reviews.find(review => review.user_id === currentUser.id);
        const otherReviews = reviews.filter(review => review.user_id !== currentUser.id);

        userReviewArea.innerHTML = '';
        otherReviewsList.innerHTML = '';
        if (userReview) {
            renderUserReview(userReview);
        } else {
            renderAddReviewForm();
        }
        if (otherReviews.length > 0) {
            otherReviews.forEach((review, index) => {
                const reviewCard = document.createElement('div');
                reviewCard.className = 'review-card';
                reviewCard.style.animationDelay = `${index * 0.1}s`;
                reviewCard.innerHTML = `
                    <div class="review-header"><span class="review-username">${review.User.name}</span></div>
                    <p class="review-text">${review.text}</p>
                `;
                otherReviewsList.appendChild(reviewCard);
            });
        } else {
            otherReviewsList.innerHTML = '<p>Be the first to leave a review!</p>';
        }
    }

    function renderUserReview(review) {
        userReviewArea.innerHTML = `
            <div class="review-card user-review">
                <div class="review-header">
                    <span class="review-username">${currentUser.name} (Your Review)</span>
                    <button class="btn btn-secondary" id="edit-review-btn">Edit</button>
                </div>
                <p class="review-text">${review.comment}</p>
            </div>
        `;
        document.getElementById('edit-review-btn').addEventListener('click', () => renderEditReviewForm(review));
    }

    function renderAddReviewForm() {
        userReviewArea.innerHTML = `
            <h3>Add Your Review</h3>
            <form id="review-form"><textarea id="review-text-input" placeholder="What did you think of the book?" required></textarea><div class="form-actions"><button type="submit" class="btn btn-primary">Submit Review</button></div></form>
        `;
        document.getElementById('review-form').addEventListener('submit', handleFormSubmit);
    }

    function renderEditReviewForm(review) {
        userReviewArea.innerHTML = `
            <h3>Edit Your Review</h3>
            <form id="review-form"><textarea id="review-text-input" required>${review.comment}</textarea><div class="form-actions"><button type="submit" class="btn btn-primary">Update Review</button><button type="button" class="btn btn-secondary" id="cancel-edit-btn">Cancel</button></div></form>
        `;
        document.getElementById('review-form').addEventListener('submit', handleFormSubmit);
        document.getElementById('cancel-edit-btn').addEventListener('click', () => renderUserReview(review));
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const reviewText = document.getElementById('review-text-input').value;
        console.log('Review text:', reviewText);
        if (!reviewText.trim()) {
            alert('Review cannot be empty!');
            return;
        }
        postReview(reviewText);
    }

    fetchLendingDetails();


    async function requestBookReturn() {
        if (!confirm('Are you sure you want to request to return this book?')) return;
        try {
            // const response = await axios.put(`http://${HOST}:3000/api/lendings/return-request/${lendingId}`, {}, {
            //     headers: { 'Authorization': `Bearer ${authToken}` }
            // });
            const response = await axios.put(`${HOST}:3000/api/lendings/return-request/${lendingId}`, {}, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            console.log('Return request response:', response.data);

            alert(response.data.message);

            fetchLendingDetails();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to request return.');
        }
    }//requestBookReturn


    function renderBookAndLendingDetails(lending) {
        const dueDate = new Date(lending.due_date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const book = lending.Book;

        let actionButton = '';
        // Conditionally render the button based on the return_status
        if (lending.return_status === 'borrowed') {
            actionButton = `<button id="return-btn" class="btn btn-primary">Request Return</button>`;
        } else if (lending.return_status === 'return_pending') {
            actionButton = `<button class="btn btn-secondary" disabled>Return Pending Approval</button>`;
        }

        bookDetailContainer.innerHTML = `
        <h1>${book.title}</h1>
        <p class="author">by ${book.author}</p>
        <p class="description">${book.description || 'No description available.'}</p>
        
        <div class="lending-info">
            <p class="status">Status: <strong>On Loan</strong></p>
            <p class="due-date">Due Date: <strong>${dueDate}</strong></p>
            <div class="action-buttons">
                ${actionButton}
                <button id="extend-btn" class="btn btn-secondary">Extend by 7 Days</button>
            </div>
        </div>
    `;

        // Add event listeners after rendering
        const returnButton = document.getElementById('return-btn');
        if (returnButton) {
            returnButton.addEventListener('click', requestBookReturn);
        }
        const extendButton = document.getElementById('extend-btn');
        if (extendButton) {
            extendButton.addEventListener('click', requestExtension);
        }
    }// renderBookAndLendingDetails
});
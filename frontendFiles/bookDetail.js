console.log('bookDetail.js loaded');
// const HOST = 'http://localhost:3000';
const HOST = 'https://book-len/ding-and-review.onrender.com';

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

    const signOutBtn = document.getElementById('signOutBtn');

    signOutBtn.addEventListener('click', () => {
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                console.log('User signed out. Redirecting to login page.');
                window.location.href = './index.html';
            });
        }
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
        console.log('Fetching lending details inside books page for ID:', lendingId);

        try {
            // const response = await axios.get(`http://${HOST}:3000/api/lendings/${lendingId}`, {
            //     headers: { 'Authorization': `Bearer ${authToken}` }
            // });
            const response = await axios.get(`${HOST}/api/lendings/${lendingId}`, {
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
    }// fetchLendingDetails

    async function requestExtension() {
        console.log('Requesting extension on books page for lending ID :', lendingId);

        if (!confirm('Are you sure you want to request a 7-day extension?')) {
            return;
        }
        try {
            // const response = await axios.put(`http://${HOST}:3000/api/lendings/extend/${lendingId}`, {}, {
            //     headers: { 'Authorization': `Bearer ${authToken}` }
            // });
            const response = await axios.put(`${HOST}/api/lendings/extend/${lendingId}`, {}, {
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
    }// requestExtension

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

        const extendButton = document.getElementById('extend-btn');
        if (extendButton) {
            extendButton.addEventListener('click', requestExtension);
        }
    }// renderBookAndLendingDetails

    async function fetchReviews() {
        console.log('Fetching reviews on books page for book ID:', actualBookId);

        if (!actualBookId) return;
        try {
            // const response = await axios.get(`http://${HOST}:3000/api/books/${actualBookId}/reviews`, {
            //     headers: { 'Authorization': `Bearer ${authToken}` }
            // });
            const response = await axios.get(`${HOST}/api/books/${actualBookId}/reviews`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            console.log('Fetched reviews:', response.data);

            renderReviewSection(response.data.data);

        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            otherReviewsList.innerHTML = `<p style="color:red;">Could not load reviews.</p>`;
        }
    }// fetchReviews

    async function postReview(rating, reviewText) {
        console.log('books page Posting review:', { rating, reviewText });

        if (!actualBookId) return;
        try {
            let res = await axios.post(`${HOST}/api/books/${actualBookId}/review`,
                { rating: rating, comment: reviewText },
                { headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            console.log('Review posted:', res.data);

            alert('Review saved successfully!');

            fetchReviews();
        } catch (error) {
            console.error('Error saving review:', error);
            alert('Error saving review. Please try again.');
        }
    }// postReview

    function renderReviewSection(reviews) {
        console.log('Books page Rendering reviews:', reviews);

        const userReview = reviews.find(review => review.user_id === currentUser.id);
        const otherReviews = reviews.filter(review => review.user_id !== currentUser.id);
        console.log('User review:', userReview);
        console.log('Other reviews:', otherReviews);

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
                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                console.log('Rendering stars:', stars);

                reviewCard.innerHTML = `
              <div class="review-header"><span class="review-username">${review.User.name}</span></div>
              <div class="saved-rating">${stars}</div>
              <p class="review-text">${review.comment}</p>
                `;
                otherReviewsList.appendChild(reviewCard);
            });
        } else {
            otherReviewsList.innerHTML = '<p>Be the first to leave a review!</p>';
        }
    }// renderReviewSection

    function renderUserReview(review) {
        console.log('Rendering user review:', review);
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        userReviewArea.innerHTML = `
        <div class="review-card user-review">
            <div class="review-header">
                <span class="review-username">${currentUser.name} (Your Review)</span>
                <button class="btn btn-secondary" id="edit-review-btn">Edit</button>
            </div>
            <div class="saved-rating">${stars}</div>
            <p class="review-text">${review.comment}</p>
        </div>
    `;
        document.getElementById('edit-review-btn').addEventListener('click', () => renderEditReviewForm(review));
    }// renderUserReview

    function renderAddReviewForm() {
        console.log('Rendering add review form');
        userReviewArea.innerHTML = `
        <h3>Add Your Review</h3>
        <form id="review-form">
            <div class="rating">
                <input type="radio" id="star5" name="rating" value="5" /><label for="star5">★</label>
                <input type="radio" id="star4" name="rating" value="4" /><label for="star4">★</label>
                <input type="radio" id="star3" name="rating" value="3" /><label for="star3">★</label>
                <input type="radio" id="star2" name="rating" value="2" /><label for="star2">★</label>
                <input type="radio" id="star1" name="rating" value="1" /><label for="star1">★</label>
            </div>
            <textarea id="review-text-input" placeholder="What did you think of the book?" required></textarea>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Submit Review</button>
            </div>
        </form>
    `;
        document.getElementById('review-form').addEventListener('submit', handleFormSubmit);
    }

    function renderEditReviewForm(review) {
        userReviewArea.innerHTML = `
        <h3>Edit Your Review</h3>
        <form id="review-form">
            <div class="rating">
                <input type="radio" id="star5" name="rating" value="5" ${review.rating == 5 ? 'checked' : ''} /><label for="star5">★</label>
                <input type="radio" id="star4" name="rating" value="4" ${review.rating == 4 ? 'checked' : ''} /><label for="star4">★</label>
                <input type="radio" id="star3" name="rating" value="3" ${review.rating == 3 ? 'checked' : ''} /><label for="star3">★</label>
                <input type="radio" id="star2" name="rating" value="2" ${review.rating == 2 ? 'checked' : ''} /><label for="star2">★</label>
                <input type="radio" id="star1" name="rating" value="1" ${review.rating == 1 ? 'checked' : ''} /><label for="star1">★</label>
            </div>
            <textarea id="review-text-input" required>${review.comment}</textarea>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Update Review</button>
                <button type="button" class="btn btn-secondary" id="cancel-edit-btn">Cancel</button>
            </div>
        </form>
    `;
        document.getElementById('review-form').addEventListener('submit', handleFormSubmit);
        document.getElementById('cancel-edit-btn').addEventListener('click', () => renderUserReview(review));
    }

    function handleFormSubmit(event) {
        console.log('Books page Handling form submission...');
        
        event.preventDefault();
        console.log(`Handling form submission...`);
        // --- CHANGE: Get the selected rating value ---
        const rating = document.querySelector('input[name="rating"]:checked');
        const reviewText = document.getElementById('review-text-input').value;
        console.log('Review text:', reviewText, 'Rating:', rating ? rating.value : 'No rating selected');

        if (!rating) {
            console.error('No rating selected.');
            alert('Please select a rating.');
            return;
        }
        if (!reviewText.trim()) {
            console.error('Review text is empty.');
            alert('Review cannot be empty!');
            return;
        }
        postReview(rating.value, reviewText);
    }// handleFormSubmit

    fetchLendingDetails();


    async function requestBookReturn() {
        console.log('Books page Requesting return for lending ID:', lendingId);

        if (!confirm('Are you sure you want to request to return this book?')) return;
        try {
            // const response = await axios.put(`http://${HOST}:3000/api/lendings/return-request/${lendingId}`, {}, {
            //     headers: { 'Authorization': `Bearer ${authToken}` }
            // });
            const response = await axios.put(`${HOST}/api/lendings/return-request/${lendingId}`, {}, {
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
        console.log('Books page Rendering book and lending details:', lending);

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
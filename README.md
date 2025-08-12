//live link for the access of others
https://book-lending-ui.onrender.com

Spark Library - Book Lending & Review Platform

A full-stack web application built with a Node.js backend and a vanilla JavaScript frontend. This platform allows users to register, browse a library of books, borrow available titles, and leave reviews. The application features a robust role-based access control system, providing a separate, secure dashboard for administrators to manage the book inventory and user return requests.

 Features

    User Authentication 🔑

        Secure user registration and login with password hashing (bcryptjs).

        JWT-based authentication for protecting API routes.

    User Functionality 👤

        Browse and search the entire library of books.

        Borrow available books.

        View a personalized "My Books" list of currently borrowed items.

        View detailed information for each book, including its status and due date.

        Request a 7-day extension on a borrowed book.

        Request to return a borrowed book, pending admin approval.

        Add, view, and edit a star-rated review for any book.

    Admin Functionality 👑

        Secure admin-only dashboard.

        Add new books to the library.

        Delete existing books from the library.

        View a real-time dashboard of all pending return requests from users.

        Approve or reject return requests, which automatically updates the book's availability.

 Tech Stack

    Backend: Node.js, Express.js

    Database: MySQL

    ORM: Sequelize

    Authentication: JSON Web Tokens (jsonwebtoken), bcryptjs

    Frontend: HTML5, CSS3, Vanilla JavaScript (with Axios for API calls)

Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing purposes.

1. Clone the Repository

Bash

git clone <your-repository-url>
cd <project-directory>

2. Install Dependencies

Bash

npm install

3. Set Up Environment Variables

Create a .env file in the root of the project and add the following configuration variables.
Code snippet

DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=library_db
JWT_SECRET=a_very_secret_key_that_is_long_and_secure
PORT=3000

4. Run the Application

The server uses sequelize.sync() to automatically create and update your database tables based on the models.
Bash

# For development with auto-restarting
nodemon index.js

# For standard execution
node index.js

The server will start on http://localhost:3000.

Of course. Here is a detailed project description suitable for a README.md file in your Git repository. It covers the project's features, setup instructions, and a complete list of the API endpoints we've built.

You can copy and paste the entire text below into a file named README.md in your project's root directory.

Spark Library - Book Lending & Review Platform

A full-stack web application built with a Node.js backend and a vanilla JavaScript frontend. This platform allows users to register, browse a library of books, borrow available titles, and leave reviews. The application features a robust role-based access control system, providing a separate, secure dashboard for administrators to manage the book inventory and user return requests.

✨ Features

    User Authentication 🔑

        Secure user registration and login with password hashing (bcryptjs).

        JWT-based authentication for protecting API routes.

    User Functionality 👤

        Browse and search the entire library of books.

        Borrow available books.

        View a personalized "My Books" list of currently borrowed items.

        View detailed information for each book, including its status and due date.

        Request a 7-day extension on a borrowed book.

        Request to return a borrowed book, pending admin approval.

        Add, view, and edit a star-rated review for any book.

    Admin Functionality 👑

        Secure admin-only dashboard.

        Add new books to the library.

        Delete existing books from the library.

        View a real-time dashboard of all pending return requests from users.

        Approve or reject return requests, which automatically updates the book's availability.

🛠️ Tech Stack

    Backend: Node.js, Express.js

    Database: MySQL

    ORM: Sequelize

    Authentication: JSON Web Tokens (jsonwebtoken), bcryptjs

    Frontend: HTML5, CSS3, Vanilla JavaScript (with Axios for API calls)

🚀 Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing purposes.

1. Clone the Repository

Bash

git clone <your-repository-url>
cd <project-directory>

2. Install Dependencies

Bash

npm install

3. Set Up Environment Variables

Create a .env file in the root of the project and add the following configuration variables.
Code snippet

DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=library_db
JWT_SECRET=a_very_secret_key_that_is_long_and_secure
PORT=3000

4. Run the Application

The server uses sequelize.sync() to automatically create and update your database tables based on the models.
Bash

# For development with auto-restarting
nodemon index.js

# For standard execution
node index.js

The server will start on http://localhost:3000.

🔀 API Endpoints

All endpoints are prefixed with /api.

User Routes (/users)

Endpoint	Method	Access	Description
/users/register	POST	Public	Registers a new user.
/users/login	POST	Public	Logs in a user and returns a JWT token.

Book & Review Routes (/books)

Endpoint	Method	Access	Description
/books	GET	User	Fetches a list of all books in the library.
/books	POST	Admin	Adds a new book to the database.
/books/:bookId	GET	User	Fetches details for a single book.
/books/:bookId	DELETE	Admin	Deletes a book from the database.
/books/:bookId/reviews	GET	User	Fetches all reviews for a specific book.
/books/:bookId/review	POST	User	Adds a new review or updates an existing one for a specific book.


Lending Routes (/lendings)

Endpoint	Method	Access	Description
/lendings	GET	User	Fetches all books currently borrowed by the logged-in user.
/lendings/borrow	POST	User	Borrows an available book.
/lendings/:lendingId	GET	User	Fetches details of a specific lending record.
/lendings/extend/:lendingId	PUT	User	Requests a 7-day extension for a borrowed book.
/lendings/return-request/:lendingId	PUT	User	Submits a request to return a borrowed book.
/lendings/admin/pending-returns	GET	Admin	Fetches all return requests that are pending approval.
/lendings/admin/process-return/:lendingId	PUT	Admin	Approves or rejects a pending return request.

Becoming an Admin

To access the admin functionality:

    Register a user through the application.

    Manually update that user's record in the database to grant admin privileges. Connect to your MySQL database and run:
    SQL

    UPDATE Users SET isAdmin = true WHERE email = 'your-admin-email@example.com';

    Log out and log back in as that user. You will be automatically redirected to the admin panel.




        

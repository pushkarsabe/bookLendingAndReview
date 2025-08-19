const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const sendBookReturnEmail = async (recipientEmail, userName, bookTitle, action) => {
    try {
        const apiKey = process.env.BREVO_API_KEY; // Using BREVO_API_KEY for clarity
        console.log(`recipientEmail: ${recipientEmail}, userName: ${userName}, bookTitle: ${bookTitle}, action: ${action}`);

        if (!apiKey) {
            throw new Error('Brevo (Sendinblue) API key is not defined in environment variables');
        }

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey = apiKey;

        let subject = '';
        let status = '';
        let message = '';

        if (action === 'approve') {

            subject = 'Book Return Request Approved';
            status = 'Approved';
            message = `Good news! Your return request for the book "${bookTitle}" has been approved by an admin. Thank you for using our library services.`;

        } else if (action === 'reject') {
            subject = 'Book Return Request Rejected';
            status = 'Rejected';
            message = `Hello ${userName}, Unfortunately, your return request for the book "${bookTitle}" has been rejected by an admin. Please contact support for more details.`;
        }

        const emailContent = `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: ${action === 'approve' ? '#2E8B57' : '#dc3545'};">${subject}</h2>
                    <p>Dear ${userName},</p>
                    <p>${message}</p>
                    <p><strong>Request Status:</strong> <span style="color: ${action === 'approve' ? 'green' : 'red'};">${status}</span></p>
                    <p>Best regards,<br>
                    <strong>The Spark Library Team</strong></p>
                </body>
            </html>
        `;

        const emailData = {
            sender: {
                name: 'Spark Library',
                email: 'pushkarsabe@gmail.com',
            },
            to: [
                {
                    email: 'sabepushkar@gmail.com',
                    name: userName,
                },
            ],
            subject: subject,
            htmlContent: emailContent,
        };

        await apiInstance.sendTransacEmail(emailData);
        console.log('Email sent successfully!');
    } catch (err) {
        console.error('Error sending email:', err);
    }
};


const sendOverdueReminderEmail = async (recipientEmail, userName, bookTitle, dueDate) => {
    try {
        console.log(`sendOverdueReminderEmail called with recipientEmail: ${recipientEmail}, userName: ${userName}, bookTitle: ${bookTitle}, dueDate: ${dueDate}`);

        const apiKey = process.env.BREVO_API_KEY;
        console.log(`Sending overdue reminder to: ${recipientEmail} for book: ${bookTitle}`);

        if (!apiKey) {
            throw new Error('Brevo (Sendinblue) API key is not defined in environment variables');
        }

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey = apiKey;

        const subject = 'Overdue Book Reminder';
        const message = `This is a friendly reminder that your borrowed book, "${bookTitle}", was due on ${dueDate}. Please return it at your earliest convenience or request a 15-day extension from the book details page.`;

        const emailContent = `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #dc3545;">${subject}</h2>
                    <p>Dear ${userName},</p>
                    <p>${message}</p>
                    <p>Best regards,<br>
                    <strong>The Spark Library Team</strong></p>
                </body>
            </html>
        `;

        const emailData = {
            sender: {
                name: 'Spark Library',
                email: 'pushkarsabe@gmail.com',
            },
            to: [
                {
                    email: recipientEmail,
                    name: userName,
                },
            ],
            subject: subject,
            htmlContent: emailContent,
        };

        await apiInstance.sendTransacEmail(emailData);
        console.log('Overdue reminder email sent successfully!');
    } catch (err) {
        console.error('Error sending overdue reminder email:', err);
    }
};

module.exports = sendBookReturnEmail;
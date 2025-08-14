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

module.exports = sendBookReturnEmail;
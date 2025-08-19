const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sequelize = require('../util/database');
const Book = require('../model/Book');
const Lending = require('../model/Lending');
const Transaction = require('../model/Transaction');

exports.createCheckoutSession = async (req, res) => {
    console.log('Creating checkout session for stripe payment');

    const { bookId, bookTitle, price } = req.body;
    const userId = req.user.id;
    console.log(`Book ID: ${bookId}, Book Title: ${bookTitle}, Price: ${price}, User ID: ${userId}`);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [/* ... */],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/success.html`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel.html`,
            // ADD METADATA
            metadata: {
                book_id: bookId,
                user_id: userId,
            }
        });

        return res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
};


// B. CREATE THE WEBHOOK HANDLER
exports.handleStripeWebhook = async (req, res) => {
    console.log('Handling Stripe webhook event');

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { book_id, user_id } = session.metadata;

        const t = await sequelize.transaction();
        try {
            // 1. Mark book as borrowed
            const book = await Book.findByPk(book_id, { transaction: t });
            if (!book || book.status !== 'available') {
                await t.rollback();
                console.error('Book not available for borrowing.');
                return res.status(400).send('Book not available.');
            }
            await book.update({ status: 'borrowed' }, { transaction: t });

            // 2. Create Lending record
            const borrow_date = new Date();
            const due_date = new Date();
            due_date.setDate(borrow_date.getDate() + 14);

            const newLending = await Lending.create({
                user_id,
                book_id,
                borrow_date,
                due_date,
            }, { transaction: t });

            // 3. Create Transaction record
            await Transaction.create({
                stripe_session_id: session.id,
                lending_id: newLending.lending_id,
                amount: session.amount_total,
                currency: session.currency,
                status: 'completed',
            }, { transaction: t });

            await t.commit();
        } catch (error) {
            await t.rollback();
            console.error('Error in webhook transaction:', error);
            return res.status(500).json({ message: 'Server error during webhook processing.' });
        }
    }

    res.json({ received: true });
};
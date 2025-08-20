const Razorpay = require('razorpay');
const crypto = require('crypto');
const sequelize = require('../util/database');
const Book = require('../model/Book');
const Lending = require('../model/Lending');
const Transaction = require('../model/Transaction');
const User = require('../model/User');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
    console.log('Creating Razorpay order with body:');
    const { amount, currency, bookId } = req.body;
    console.log(`Amount: ${amount}, Currency: ${currency}, Book ID: ${bookId}`);

    try {
        const options = {
            amount: 2000,
            currency: currency,
            receipt: `receipt_book_${bookId}_${Date.now()}`
        };
        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).send('Error creating order');
        }
        console.log('Razorpay order created:', order);

        res.json(order);
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).send('Server error');
    }
};


exports.verifyPayment = async (req, res) => {
    console.log('Verifying Razorpay payment:');

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, book_id, user_id } = req.body;
    console.log(`Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}, Signature: ${razorpay_signature}, Book ID: ${book_id}, User ID: ${user_id}`);

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    console.log('shasum ', shasum);

    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');
    console.log('shasum ', shasum);

    if (digest !== razorpay_signature) {
        return res.status(400).json({ msg: 'Transaction not legit!' });
    }
    console.log(`Payment signature verified: ${digest}`);

    const t = await sequelize.transaction();
    try {
        // Mark book as borrowed
        const book = await Book.findByPk(book_id, { transaction: t });
        if (!book || book.status !== 'available') {
            await t.rollback();
            return res.status(400).json({ message: 'Book is not available for borrowing.' });
        }
        console.log(`Book : ${book}, updating status to borrowed.`);

        await book.update({ status: 'borrowed' }, { transaction: t });

        // Create Lending record
        const borrow_date = new Date();
        const due_date = new Date();
        due_date.setDate(borrow_date.getDate() + 14);
        console.log('borrow_date - ', borrow_date, ' and due_date - ', due_date);
        
        const newLending = await Lending.create({
            user_id,
            book_id,
            borrow_date,
            due_date,
        }, { transaction: t });

        // Create Transaction record
        let order = await Transaction.create({
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            lending_id: newLending.lending_id,
            amount: 2000, // Hardcoded amount in paisa (200.00 INR)
            currency: 'INR',
            status: 'completed',
        }, { transaction: t });

        await t.commit();

        console.log('Payment verified and transaction completed successfully.', order);

        res.json({
            msg: 'success',
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
        });

    } catch (error) {
        await t.rollback();
        console.error('Error in webhook transaction:', error);
        return res.status(500).json({ message: 'Server error during transaction processing.' });
    }
};
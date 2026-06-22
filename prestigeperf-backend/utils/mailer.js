const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const generateReceiptPDF = (order, user) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('PRESTIGEPERF', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('Order Receipt', { align: 'center' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Order Info
        doc.fontSize(11).font('Helvetica-Bold').text('Order Details:');
        doc.font('Helvetica');
        doc.text(`Order ID: #${order.order_id}`);
        doc.text(`Date: ${new Date(order.order_date).toLocaleDateString()}`);
        doc.text(`Status: ${order.order_status}`);
        doc.text(`Payment Method: ${order.payment_method}`);
        if (order.payment_reference) {
            doc.text(`Payment Reference: ${order.payment_reference}`);
        }
        doc.moveDown();

        // Customer Info
        doc.font('Helvetica-Bold').text('Customer:');
        doc.font('Helvetica');
        doc.text(`Name: ${user.username}`);
        doc.text(`Email: ${user.email}`);
        doc.moveDown();

        // Items Table Header
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold');
        const tableTop = doc.y;
        doc.text('Product', 50, tableTop, { width: 200 });
        doc.text('Qty', 250, tableTop, { width: 80 });
        doc.text('Price', 330, tableTop, { width: 100 });
        doc.text('Subtotal', 430, tableTop, { width: 100 });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Items
        let total = 0;
        doc.font('Helvetica');
        order.OrderDetails.forEach(detail => {
            const subtotal = detail.quantity * parseFloat(detail.price);
            total += subtotal;
            const y = doc.y;
            doc.text(detail.Product?.product_name ?? 'N/A', 50, y, { width: 200 });
            doc.text(String(detail.quantity), 250, y, { width: 80 });
            doc.text(`P${parseFloat(detail.price).toFixed(2)}`, 330, y, { width: 100 });
            doc.text(`P${subtotal.toFixed(2)}`, 430, y, { width: 100 });
            doc.moveDown();
        });

        // Total
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold');
        doc.text(`Total: P${total.toFixed(2)}`, { align: 'right' });
        doc.moveDown();

        // Footer
        doc.font('Helvetica').fontSize(10).text('Thank you for shopping with PrestigePerf!', { align: 'center' });

        doc.end();
    });
};

module.exports = { transporter, generateReceiptPDF };
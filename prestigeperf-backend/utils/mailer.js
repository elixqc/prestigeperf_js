const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: Number(process.env.MAIL_PORT) === 465,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const toPlain = model => (model?.get ? model.get({ plain: true }) : model);

// ─────────────────────────────────────────────
//  HTML EMAIL TEMPLATE
// ─────────────────────────────────────────────
const generateEmailHTML = (order, user) => {
    const formatCurrency = amount => `&#8369;${parseFloat(amount || 0).toFixed(2)}`;
    const items = Array.isArray(order.OrderDetails) ? order.OrderDetails : [];
    const total = items.reduce((sum, d) => sum + (d.quantity || 0) * parseFloat(d.price || 0), 0);

    const itemRows = items.map((d, i) => {
        const name     = d.Product?.product_name || 'N/A';
        const qty      = d.quantity || 0;
        const price    = parseFloat(d.price || 0);
        const subtotal = qty * price;
        const bg       = i % 2 === 0 ? '#1a1008' : '#120d04';
        return `
        <tr style="background:${bg};">
            <td style="padding:12px 16px; color:#e8d9b5; font-size:13px; border-bottom:1px solid #2e2010;">${name}</td>
            <td style="padding:12px 16px; color:#c9a84c; font-size:13px; text-align:center; border-bottom:1px solid #2e2010;">${qty}</td>
            <td style="padding:12px 16px; color:#e8d9b5; font-size:13px; text-align:right; border-bottom:1px solid #2e2010;">${formatCurrency(price)}</td>
            <td style="padding:12px 16px; color:#c9a84c; font-weight:bold; font-size:13px; text-align:right; border-bottom:1px solid #2e2010;">${formatCurrency(subtotal)}</td>
        </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Order Receipt</title></head>
<body style="margin:0;padding:0;background:#0a0704;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0704;padding:32px 0;">
  <tr><td align="center">
    <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(135deg,#0f0a02 0%,#1e1404 50%,#0f0a02 100%);border-top:3px solid #c9a84c;border-radius:8px 8px 0 0;padding:40px 48px 32px;text-align:center;">
          <div style="color:#c9a84c;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin-bottom:10px;">✦ Luxury Fragrances ✦</div>
          <div style="color:#e8d9b5;font-size:32px;font-weight:bold;letter-spacing:6px;text-transform:uppercase;margin-bottom:4px;">PRESTIGE</div>
          <div style="color:#c9a84c;font-size:14px;letter-spacing:8px;text-transform:uppercase;margin-bottom:16px;">PERFUMERY</div>
          <div style="width:60px;height:1px;background:#c9a84c;margin:0 auto 16px;"></div>
          <div style="color:#8a7a5a;font-size:11px;letter-spacing:2px;font-style:italic;">EXCEPTIONAL SCENTS. TIMELESS IMPRESSION.</div>
        </td>
      </tr>

      <!-- ORDER STATUS BANNER -->
      <tr>
        <td style="background:#c9a84c;padding:14px 48px;text-align:center;">
          <span style="color:#0a0704;font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;">
            ✦ ORDER #${order.order_id} &nbsp;•&nbsp; ${order.order_status} ✦
          </span>
        </td>
      </tr>

      <!-- GREETING -->
      <tr>
        <td style="background:#120d04;border-left:1px solid #2e2010;border-right:1px solid #2e2010;padding:36px 48px 28px;">
          <p style="margin:0 0 8px;color:#8a7a5a;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Dear Customer</p>
          <p style="margin:0 0 16px;color:#e8d9b5;font-size:22px;font-weight:bold;">${user.username || 'Valued Customer'},</p>
          <p style="margin:0;color:#a09070;font-size:14px;line-height:1.8;">
            Your order status has been updated to <strong style="color:#c9a84c;">${order.order_status}</strong>. 
            Please find your receipt attached to this email. Thank you for choosing Prestige Perfumery.
          </p>
        </td>
      </tr>

      <!-- ORDER META CARDS -->
      <tr>
        <td style="background:#120d04;border-left:1px solid #2e2010;border-right:1px solid #2e2010;padding:0 48px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" style="background:#1a1008;border:1px solid #2e2010;border-top:2px solid #c9a84c;border-radius:4px;padding:16px 20px;">
                <div style="color:#8a7a5a;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Order Date</div>
                <div style="color:#e8d9b5;font-size:14px;font-weight:bold;">${new Date(order.order_date).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</div>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#1a1008;border:1px solid #2e2010;border-top:2px solid #c9a84c;border-radius:4px;padding:16px 20px;">
                <div style="color:#8a7a5a;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Payment Method</div>
                <div style="color:#e8d9b5;font-size:14px;font-weight:bold;">${order.payment_method || 'N/A'}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ITEMS TABLE -->
      <tr>
        <td style="background:#120d04;border-left:1px solid #2e2010;border-right:1px solid #2e2010;padding:0 48px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2e2010;border-radius:4px;overflow:hidden;">
            <thead>
              <tr style="background:#c9a84c;">
                <th style="padding:12px 16px;color:#0a0704;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;text-align:left;">Item</th>
                <th style="padding:12px 16px;color:#0a0704;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;text-align:center;">Qty</th>
                <th style="padding:12px 16px;color:#0a0704;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;text-align:right;">Price</th>
                <th style="padding:12px 16px;color:#0a0704;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
        </td>
      </tr>

      <!-- TOTAL -->
      <tr>
        <td style="background:#120d04;border-left:1px solid #2e2010;border-right:1px solid #2e2010;padding:0 48px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:linear-gradient(135deg,#1e1404,#2a1c08);border:1px solid #c9a84c;border-radius:4px;padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#8a7a5a;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Total Amount</td>
                    <td style="text-align:right;color:#c9a84c;font-size:22px;font-weight:bold;">${formatCurrency(total)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER NOTE -->
      <tr>
        <td style="background:#0f0a02;border:1px solid #2e2010;border-top:none;border-radius:0 0 8px 8px;padding:28px 48px;text-align:center;">
          <p style="margin:0 0 8px;color:#6a5a3a;font-size:12px;line-height:1.8;">
            Keep this email as proof of purchase. For returns or inquiries,<br>
            contact us at <a href="mailto:support@prestigeperf.com" style="color:#c9a84c;text-decoration:none;">support@prestigeperf.com</a> within 7 days.
          </p>
          <div style="margin-top:20px;padding-top:20px;border-top:1px solid #2e2010;">
            <div style="color:#c9a84c;font-size:10px;letter-spacing:3px;text-transform:uppercase;">✦ Prestige Perfumery &nbsp;•&nbsp; Manila, Philippines ✦</div>
          </div>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
};

// ─────────────────────────────────────────────
//  PDF RECEIPT GENERATOR
// ─────────────────────────────────────────────
const generateReceiptPDF = (order, user) => {
    // PDFKit's standard fonts (Helvetica, etc.) only support WinAnsiEncoding,
    // which does NOT include the ₱ glyph — it silently renders as "±" instead.
    // Using "PHP" as plain text avoids that font limitation entirely.
    const formatCurrency = amount => `PHP ${parseFloat(amount || 0).toFixed(2)}`;

    const BG        = '#111111';
    const BG_CARD   = '#1a1a1a';
    const GOLD      = '#c9a84c';
    const TEXT      = '#f0ebe0';
    const TEXT_MID  = '#9a9080';
    const TEXT_DIM  = '#6b6358';
    const LINE      = '#2a2520';

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const PAGE_W = 595.28;
        const PAGE_H = 841.89;
        const PAD    = 52;
        const INNER  = PAGE_W - PAD * 2;

        doc.rect(0, 0, PAGE_W, PAGE_H).fill(BG);

        // ── HEADER ─────────────────────────────────────────────────
        doc.rect(0, 0, PAGE_W, 2).fill(GOLD);

        doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(22)
           .text('PRESTIGE PERFUMERY', PAD, 36, { characterSpacing: 3 });

        doc.fillColor(TEXT_MID).font('Helvetica').fontSize(9)
           .text('Exceptional Scents. Timeless Impression.', PAD, 64);

        doc.fillColor(TEXT_DIM).font('Helvetica').fontSize(8)
           .text('Receipt', PAGE_W - PAD - 80, 40, { width: 80, align: 'right' });

        const orderDate = new Date(order.order_date).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const orderTime = new Date(order.order_date).toLocaleTimeString('en-PH', {
            hour: '2-digit', minute: '2-digit'
        });

        doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9)
           .text(`Order #${order.order_id}`, PAGE_W - PAD - 120, 52, { width: 120, align: 'right' });
        doc.fillColor(TEXT_MID).font('Helvetica').fontSize(8)
           .text(`${orderDate}  ·  ${orderTime}`, PAGE_W - PAD - 120, 64, { width: 120, align: 'right' });

        doc.rect(PAD, 88, INNER, 1).fill(LINE);

        // ── META ROW ───────────────────────────────────────────────
        const metaY = 104;
        const colW  = INNER / 2 - 12;
        const col2X = PAD + colW + 24;

        const sectionLabel = (label, x, y) => {
            doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(7.5)
               .text(label, x, y, { characterSpacing: 1.5 });
        };

        sectionLabel('FROM', PAD, metaY);
        doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9.5)
           .text('Prestige Perfumery', PAD, metaY + 14);
        doc.fillColor(TEXT_MID).font('Helvetica').fontSize(8.5)
           .text('Manila, Philippines', PAD, metaY + 28)
           .text('support@prestigeperf.com', PAD, metaY + 40);

        sectionLabel('ORDER', col2X, metaY);
        const orderMeta = [
            ['Status',  order.order_status],
            ['Payment', order.payment_method || 'N/A'],
            order.payment_reference ? ['Reference', order.payment_reference] : null,
        ].filter(Boolean);

        orderMeta.forEach(([label, value], i) => {
            const y = metaY + 14 + i * 13;
            doc.fillColor(TEXT_DIM).font('Helvetica').fontSize(8.5).text(label, col2X, y, { width: 60 });
            doc.fillColor(TEXT).font('Helvetica').fontSize(8.5).text(String(value), col2X + 64, y);
        });

        // ── BILL TO ──────────────────────────────────────────────────
        const billY = metaY + 72;
        doc.rect(PAD, billY, INNER, 1).fill(LINE);

        sectionLabel('BILL TO', PAD, billY + 14);
        doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9.5)
           .text(user.username || 'N/A', PAD, billY + 28);

        let contactY = billY + 42;
        doc.fillColor(TEXT_MID).font('Helvetica').fontSize(8.5);
        if (user.email)          { doc.text(user.email, PAD, contactY); contactY += 13; }
        if (user.contact_number) { doc.text(user.contact_number, PAD, contactY); contactY += 13; }
        if (user.address)        { doc.text(user.address, PAD, contactY, { width: INNER }); }

        // ── ITEMS TABLE ──────────────────────────────────────────────
        const tableY = billY + 88;

        doc.rect(PAD, tableY, INNER, 24).fill(BG_CARD);
        doc.rect(PAD, tableY + 23, INNER, 1).fill(GOLD);

        const COL = {
            item:  { x: PAD + 10,  w: 220, align: 'left'   },
            qty:   { x: PAD + 238, w: 44,  align: 'center' },
            price: { x: PAD + 290, w: 88,  align: 'right'  },
            sub:   { x: PAD + 386, w: 88,  align: 'right'  },
        };

        doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(8);
        const thY = tableY + 8;
        doc.text('ITEM',     COL.item.x,  thY, { width: COL.item.w,  align: COL.item.align });
        doc.text('QTY',      COL.qty.x,   thY, { width: COL.qty.w,   align: COL.qty.align });
        doc.text('PRICE',    COL.price.x, thY, { width: COL.price.w, align: COL.price.align });
        doc.text('SUBTOTAL', COL.sub.x,   thY, { width: COL.sub.w,   align: COL.sub.align });

        const items = Array.isArray(order.OrderDetails) ? order.OrderDetails : [];
        let rowY = tableY + 24;
        let total = 0;
        const ROW_H = 26;

        items.forEach((detail) => {
            const name     = detail.Product?.product_name || 'N/A';
            const qty      = detail.quantity || 0;
            const price    = parseFloat(detail.price || 0);
            const subtotal = qty * price;
            total += subtotal;

            const cellY = rowY + 8;
            doc.fillColor(TEXT).font('Helvetica').fontSize(9)
               .text(name, COL.item.x, cellY, { width: COL.item.w, align: COL.item.align });
            doc.text(String(qty), COL.qty.x, cellY, { width: COL.qty.w, align: COL.qty.align });
            doc.text(formatCurrency(price), COL.price.x, cellY, { width: COL.price.w, align: COL.price.align });
            doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9)
               .text(formatCurrency(subtotal), COL.sub.x, cellY, { width: COL.sub.w, align: COL.sub.align });

            doc.rect(PAD, rowY + ROW_H - 1, INNER, 1).fill(LINE);
            rowY += ROW_H;
        });

        // ── TOTAL ────────────────────────────────────────────────────
        const totalY = rowY + 16;
        doc.rect(PAD, totalY, INNER, 1).fill(GOLD);

        doc.fillColor(TEXT_MID).font('Helvetica').fontSize(9)
           .text('Total Amount', PAD, totalY + 14);
        doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(18)
           .text(formatCurrency(total), PAD, totalY + 10, { width: INNER, align: 'right' });

        // ── FOOTER ───────────────────────────────────────────────────
        const footerY = totalY + 56;
        doc.rect(PAD, footerY, INNER, 1).fill(LINE);

        doc.fillColor(TEXT_MID).font('Helvetica').fontSize(8.5)
           .text('Thank you for choosing Prestige Perfumery.', PAD, footerY + 16, {
               align: 'center', width: INNER
           });
        doc.fillColor(TEXT_DIM).font('Helvetica').fontSize(8)
           .text(
               'Keep this receipt as proof of purchase. For returns or inquiries, contact support@prestigeperf.com within 7 days.',
               PAD, footerY + 32, { align: 'center', width: INNER, lineGap: 2 }
           );

        doc.end();
    });
};

// ─────────────────────────────────────────────
//  SEND ORDER STATUS EMAIL
// ─────────────────────────────────────────────
const sendOrderStatusEmail = async (order, user, options = {}) => {
    const plainOrder = toPlain(order);
    const plainUser  = toPlain(user);
    const pdfBuffer  = await generateReceiptPDF(plainOrder, plainUser);
    const htmlBody   = generateEmailHTML(plainOrder, plainUser);
    const subject    = options.subject
        || `Order #${plainOrder.order_id} – Status: ${plainOrder.order_status}`;

    await transporter.sendMail({
        from: `"Prestige Perfumery" <${process.env.MAIL_USER}>`,
        to: plainUser.email,
        subject,
        html: htmlBody,
        attachments: [{
            filename: `receipt-order-${plainOrder.order_id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }]
    });
};

module.exports = { transporter, generateReceiptPDF, generateEmailHTML, sendOrderStatusEmail };
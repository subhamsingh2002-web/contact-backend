const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    user: 'waitlist_user',
    host: 'dpg-d1n4l6gdl3ps73fu7u00-a.oregon-postgres.render.com',
    database: 'waitlist_db_qssz',
    password: '9eSBkFHwqCT1DE3XHyK7FcIi1QI0AjKq',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

// POST: Contact form submission
app.post('/api/contact', async(req, res) => {
    console.log('POST /api/contact called with:', req.body);

    let {
        firstName,
        lastName,
        company,
        email,
        message,
        consent
    } = req.body;

    // Replace optional missing fields with 'NA'
    firstName = firstName || 'NA';
    lastName = lastName || 'NA';
    company = company || 'NA';
    email = email || 'NA';
    message = message || 'NA';
    consent = consent ? 'Yes' : 'No';

    try {
        const query = `
            INSERT INTO contact_form (
                first_name, last_name, company, email, message, consent, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id;
        `;
        const values = [firstName, lastName, company, email, message, consent];
        const result = await pool.query(query, values);

        res.status(200).json({
            message: 'Contact form submitted successfully',
            id: result.rows[0].id
        });
    } catch (err) {
        res.status(500).json({ message: 'Database error: ' + err.message });
    }
});

// GET: Export contact form submissions to Excel
app.get('/api/contact/export', async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contact_form ORDER BY id ASC');
        const rows = result.rows;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contact Submissions');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'First Name', key: 'first_name', width: 20 },
            { header: 'Last Name', key: 'last_name', width: 20 },
            { header: 'Company', key: 'company', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Message', key: 'message', width: 40 },
            { header: 'Consent', key: 'consent', width: 10 },
            { header: 'Created At', key: 'created_at', width: 30, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } }
        ];

        rows.forEach(row => {
            const istDate = new Date(row.created_at);
            istDate.setHours(istDate.getHours() + 5);
            istDate.setMinutes(istDate.getMinutes() + 30);

            worksheet.addRow({
                ...row,
                created_at: istDate
            });
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="contact_submissions.xlsx"'
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ message: 'Export error: ' + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
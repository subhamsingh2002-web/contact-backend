const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

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

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
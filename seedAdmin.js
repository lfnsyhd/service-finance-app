import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const seedAdminUser = async () => {
    try {
        const email = 'admin@info.com';
        const password = 'Alfansyahada007';

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            console.log('❌ Admin user already exists!');
            console.log('Email:', email);
        } else {
            // Insert admin user
            const result = await pool.query(
                'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
                [email, hashedPassword]
            );

            console.log('✅ Admin user created successfully!');
            console.log('Email:', email);
            console.log('Password:', password);
            console.log('User ID:', result.rows[0].id);
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
};

seedAdminUser();

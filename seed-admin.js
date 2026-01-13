require('dotenv').config();
const pool = require('./config/database');
const AuthService = require('./services/authService');

async function seedAdmin() {
    try {
        console.log('Running migrations...');
        const fs = require('fs');
        const path = require('path');

        // Execute create_admins_table.sql
        const createAdminsSql = fs.readFileSync(path.join(__dirname, 'migrations', 'create_admins_table.sql'), 'utf8');
        await pool.execute(createAdminsSql);

        // Execute create_password_resets_table.sql
        const createResetsSql = fs.readFileSync(path.join(__dirname, 'migrations', 'create_password_resets_table.sql'), 'utf8');
        await pool.execute(createResetsSql);

        console.log('Migrations completed successfully.');
        console.log('Seeding default admin user...');

        // Check if admin already exists
        const [existingAdmins] = await pool.execute('SELECT * FROM admins WHERE username = ?', ['admin']);

        if (existingAdmins.length > 0) {
            console.log('Admin user already exists. Skipping seed.');
            process.exit(0);
        }

        // Hash the default password
        const hashedPassword = await AuthService.hashPassword('admin123');

        // Insert admin user
        const query = `
      INSERT INTO admins (username, password, email, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;

        await pool.execute(query, ['admin', hashedPassword, 'admin@porters.com', 'admin']);

        console.log('✅ Default admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('\n⚠️  Please change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();

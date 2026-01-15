const pool = require('./config/database');
const AuthService = require('./services/authService');
const fs = require('fs');
const path = require('path');

async function dbInit() {
    try {
        console.log('[DB Init] Checking/Running migrations...');

        // Use a single transaction for all migrations to speed up booting
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Execute migrations in order
            const migrationFiles = [
                'create_admins_table.sql',
                'create_password_resets_table.sql',
                'init.sql'
            ];

            for (const file of migrationFiles) {
                const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf8');
                await client.query(sql);
            }

            await client.query('COMMIT');
            console.log('[DB Init] Migrations completed.');

            // Seed admin if not exists
            const adminCheck = await client.query('SELECT username FROM admins WHERE username = $1', ['admin']);
            if (adminCheck.rows.length === 0) {
                console.log('[DB Init] Seeding default admin user...');
                const hashedPassword = await AuthService.hashPassword('admin123');
                await client.query(`
                    INSERT INTO admins (username, password, email, role, "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                `, ['admin', hashedPassword, 'admin@porters.com', 'admin']);
                console.log('[DB Init] Default admin user created.');
            }
        } catch (migrationError) {
            await client.query('ROLLBACK');
            console.error('[DB Init] ERROR during migrations:', migrationError);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[DB Init] Critical connection error:', error);
    }
}

module.exports = dbInit;

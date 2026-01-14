const pool = require('../config/database');

class Admin {
    static async findByUsername(username) {
        const query = 'SELECT * FROM admins WHERE LOWER(username) = LOWER($1)';
        try {
            const result = await pool.query(query, [username]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    static async findById(id) {
        const query = 'SELECT * FROM admins WHERE id = $1';
        try {
            const result = await pool.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    static async create(adminData) {
        const { username, password, email, role } = adminData;
        const query = `
      INSERT INTO admins (username, password, email, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id
    `;
        const params = [username, password, email || null, role || 'admin'];

        try {
            const result = await pool.query(query, params);
            return { id: result.rows[0].id, username, email, role };
        } catch (error) {
            throw error;
        }
    }

    static async updatePassword(id, newPassword) {
        const query = 'UPDATE admins SET password = $1, "updatedAt" = NOW() WHERE id = $2';
        try {
            const result = await pool.query(query, [newPassword, id]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Admin;

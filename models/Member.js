const pool = require('../config/database');

class Member {
  static async create(memberData) {
    const {
      fullName, age, dob, residence, gpsAddress, phoneNumber, altPhoneNumber,
      nationality, maritalStatus, joiningDate, avatar
    } = memberData;

    const query = `
      INSERT INTO members (fullName, age, dob, residence, gpsAddress, phoneNumber, altPhoneNumber, nationality, maritalStatus, joiningDate, avatar, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [fullName, age, dob, residence, gpsAddress, phoneNumber, altPhoneNumber, nationality, maritalStatus, joiningDate, avatar];

    try {
      const [result] = await pool.execute(query, params);
      return { id: result.insertId, ...memberData };
    } catch (error) {
      throw error;
    }
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM members';
    const params = [];

    if (filters.search || filters.maritalStatus || filters.minAge !== undefined || filters.maxAge !== undefined) {
      query += ' WHERE';
      const conditions = [];
      if (filters.search) {
        conditions.push('(fullName LIKE ? OR phoneNumber LIKE ? OR residence LIKE ?)');
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }
      if (filters.maritalStatus) {
        conditions.push('maritalStatus = ?');
        params.push(filters.maritalStatus);
      }
      if (filters.minAge !== undefined && filters.minAge !== '') {
        conditions.push('age >= ?');
        params.push(filters.minAge);
      }
      if (filters.maxAge !== undefined && filters.maxAge !== '') {
        conditions.push('age <= ?');
        params.push(filters.maxAge);
      }
      query += ' ' + conditions.join(' AND ');
    }

    query += ' ORDER BY createdAt DESC';

    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM members WHERE id = ?';
    try {
      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, memberData) {
    const {
      fullName, age, dob, residence, gpsAddress, phoneNumber, altPhoneNumber,
      nationality, maritalStatus, joiningDate, avatar
    } = memberData;

    const query = `
      UPDATE members SET
        fullName = ?, age = ?, dob = ?, residence = ?, gpsAddress = ?, phoneNumber = ?,
        altPhoneNumber = ?, nationality = ?, maritalStatus = ?, joiningDate = ?, avatar = ?,
        updatedAt = NOW()
      WHERE id = ?
    `;
    const params = [fullName, age, dob, residence, gpsAddress, phoneNumber, altPhoneNumber, nationality, maritalStatus, joiningDate, avatar, id];

    try {
      const [result] = await pool.execute(query, params);
      if (result.affectedRows === 0) {
        return null;
      }
      return { id, ...memberData };
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM members WHERE id = ?';
    try {
      const [result] = await pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN age <= 18 THEN 1 ELSE 0 END) as kids,
        SUM(CASE WHEN age > 18 THEN 1 ELSE 0 END) as adults,
        SUM(CASE WHEN LOWER(maritalStatus) = 'single' THEN 1 ELSE 0 END) as singles,
        SUM(CASE WHEN LOWER(maritalStatus) = 'married' THEN 1 ELSE 0 END) as married,
        SUM(CASE WHEN LOWER(maritalStatus) = 'widowed' THEN 1 ELSE 0 END) as widows
      FROM members
    `;
    try {
      const [rows] = await pool.execute(query);
      const stats = rows[0];
      // Convert to numbers as they might return as strings from some DB drivers
      return {
        total: Number(stats.total) || 0,
        kids: Number(stats.kids) || 0,
        adults: Number(stats.adults) || 0,
        singles: Number(stats.singles) || 0,
        married: Number(stats.married) || 0,
        widows: Number(stats.widows) || 0,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Member;

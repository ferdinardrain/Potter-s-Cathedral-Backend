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
    const isTrash = filters.trash === 'true' || filters.trash === true;
    const table = isTrash ? 'trash_members' : 'members';
    let query = `SELECT * FROM ${table}`;
    const params = [];
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

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ' + (isTrash ? 'deletedAt DESC' : 'createdAt DESC');

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
    // 1. Get member
    const member = await this.findById(id);
    if (!member) return false;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 2. Insert into trash_members
      const insertQuery = `
        INSERT INTO trash_members (id, fullName, age, dob, residence, gpsAddress, phoneNumber, altPhoneNumber, nationality, maritalStatus, joiningDate, avatar, createdAt, updatedAt, deletedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      const insertParams = [
        member.id, member.fullName, member.age, member.dob, member.residence,
        member.gpsAddress, member.phoneNumber, member.altPhoneNumber, member.nationality,
        member.maritalStatus, member.joiningDate, member.avatar, member.createdAt, member.updatedAt
      ];
      await connection.execute(insertQuery, insertParams);

      // 3. Delete from members
      await connection.execute('DELETE FROM members WHERE id = ?', [id]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async restore(id) {
    const [rows] = await pool.execute('SELECT * FROM trash_members WHERE id = ?', [id]);
    const member = rows[0];
    if (!member) return false;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Check if ID already exists in members
      const [existing] = await connection.execute('SELECT id FROM members WHERE id = ?', [member.id]);
      if (existing.length > 0) {
        // ID exists, let's update instead of insert to avoid crash, or just delete the existing one
        await connection.execute('DELETE FROM members WHERE id = ?', [member.id]);
      }

      // 2. Insert back into members
      const insertQuery = `
        INSERT INTO members (id, fullName, age, dob, residence, gpsAddress, phoneNumber, altPhoneNumber, nationality, maritalStatus, joiningDate, avatar, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const insertParams = [
        member.id, member.fullName, member.age, member.dob, member.residence,
        member.gpsAddress, member.phoneNumber, member.altPhoneNumber, member.nationality,
        member.maritalStatus, member.joiningDate, member.avatar, member.createdAt, member.updatedAt
      ];
      await connection.execute(insertQuery, insertParams);

      // 3. Delete from trash_members
      await connection.execute('DELETE FROM trash_members WHERE id = ?', [id]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async permanentDelete(id) {
    const query = 'DELETE FROM trash_members WHERE id = ?';
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

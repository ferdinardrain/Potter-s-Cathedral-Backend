const pool = require('../config/database');

class Member {
  static async create(memberData) {
    const {
      fullName, age, dob, residence, gpsAddress, phoneNumber, altPhoneNumber,
      nationality, maritalStatus, joiningDate, avatar
    } = memberData;

    // Sanitize age: convert empty string to null for PostgreSQL integer column
    const sanitizedAge = age === '' || age === null || age === undefined ? null : parseInt(age);

    const query = `
      INSERT INTO members ("fullName", age, dob, residence, "gpsAddress", "phoneNumber", "altPhoneNumber", nationality, "maritalStatus", "joiningDate", avatar, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id
    `;
    const params = [fullName, sanitizedAge, dob, residence, gpsAddress, phoneNumber, altPhoneNumber, nationality, maritalStatus, joiningDate, avatar];

    try {
      const result = await pool.query(query, params);
      return { id: result.rows[0].id, ...memberData };
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

    // Parameter counter for Postgres $1, $2...
    let paramCount = 1;

    if (filters.search) {
      conditions.push(`("fullName" ILIKE $${paramCount} OR "phoneNumber" ILIKE $${paramCount + 1} OR residence ILIKE $${paramCount + 2})`);
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      paramCount += 3;
    }
    if (filters.maritalStatus) {
      conditions.push('"maritalStatus" = $' + paramCount);
      params.push(filters.maritalStatus);
      paramCount++;
    }
    if (filters.minAge !== undefined && filters.minAge !== '') {
      conditions.push('age >= $' + paramCount);
      params.push(filters.minAge);
      paramCount++;
    }
    if (filters.maxAge !== undefined && filters.maxAge !== '') {
      conditions.push('age <= $' + paramCount);
      params.push(filters.maxAge);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ' + (isTrash ? '"deletedAt" DESC' : '"createdAt" DESC');

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const memberId = parseInt(id);
    const query = 'SELECT * FROM members WHERE id = $1';
    try {
      const result = await pool.query(query, [memberId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, memberData) {
    const {
      fullName, age, dob, residence, gpsAddress, phoneNumber, altPhoneNumber,
      nationality, maritalStatus, joiningDate, avatar
    } = memberData;

    const memberId = parseInt(id);

    // Sanitize age: convert empty string to null for PostgreSQL integer column
    const sanitizedAge = age === '' || age === null || age === undefined ? null : parseInt(age);

    const query = `
      UPDATE members SET
        "fullName" = $1, age = $2, dob = $3, residence = $4, "gpsAddress" = $5, "phoneNumber" = $6,
        "altPhoneNumber" = $7, nationality = $8, "maritalStatus" = $9, "joiningDate" = $10, avatar = $11,
        "updatedAt" = NOW()
      WHERE id = $12
    `;
    const params = [fullName, sanitizedAge, dob, residence, gpsAddress, phoneNumber, altPhoneNumber, nationality, maritalStatus, joiningDate, avatar, memberId];

    try {
      const result = await pool.query(query, params);
      if (result.rowCount === 0) {
        return null;
      }
      return { id, ...memberData };
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    const memberId = parseInt(id);
    console.log(`[Member.delete] Moving member ID ${memberId} to trash`);

    // 1. Get member
    const member = await this.findById(memberId);
    if (!member) {
      console.log(`[Member.delete] Member ID ${memberId} not found in active members`);
      return false;
    }

    console.log(`[Member.delete] Found member - ID: ${member.id}, Name: "${member.fullName}"`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 2. Insert into trash_members (UPSERT to replace any existing record with same ID)
      const insertQuery = `
        INSERT INTO trash_members (id, "fullName", age, dob, residence, "gpsAddress", "phoneNumber", "altPhoneNumber", nationality, "maritalStatus", "joiningDate", avatar, "createdAt", "updatedAt", "deletedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        ON CONFLICT (id) DO UPDATE SET
          "fullName" = EXCLUDED."fullName",
          age = EXCLUDED.age,
          dob = EXCLUDED.dob,
          residence = EXCLUDED.residence,
          "gpsAddress" = EXCLUDED."gpsAddress",
          "phoneNumber" = EXCLUDED."phoneNumber",
          "altPhoneNumber" = EXCLUDED."altPhoneNumber",
          nationality = EXCLUDED.nationality,
          "maritalStatus" = EXCLUDED."maritalStatus",
          "joiningDate" = EXCLUDED."joiningDate",
          avatar = EXCLUDED.avatar,
          "createdAt" = EXCLUDED."createdAt",
          "updatedAt" = EXCLUDED."updatedAt",
          "deletedAt" = NOW()
      `;
      const insertParams = [
        member.id, member.fullName, member.age, member.dob, member.residence,
        member.gpsAddress, member.phoneNumber, member.altPhoneNumber, member.nationality,
        member.maritalStatus, member.joiningDate, member.avatar, member.createdAt, member.updatedAt
      ];
      const insertResult = await client.query(insertQuery, insertParams);
      console.log(`[Member.delete] Inserted into trash_members, rows affected: ${insertResult.rowCount}`);

      // 3. Delete from members
      const deleteResult = await client.query('DELETE FROM members WHERE id = $1', [memberId]);
      console.log(`[Member.delete] Deleted from members table, rows affected: ${deleteResult.rowCount}`);

      await client.query('COMMIT');
      console.log(`[Member.delete] Transaction committed successfully for ID ${memberId}`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`[Member.delete] ERROR moving member to trash:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async restore(id) {
    const result = await pool.query('SELECT * FROM trash_members WHERE id = $1', [id]);
    const member = result.rows[0];
    if (!member) return false;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Check if ID already exists in members
      const existing = await client.query('SELECT id FROM members WHERE id = $1', [member.id]);
      if (existing.rows.length > 0) {
        await client.query('DELETE FROM members WHERE id = $1', [member.id]);
      }

      // 2. Insert back into members
      const insertQuery = `
        INSERT INTO members (id, "fullName", age, dob, residence, "gpsAddress", "phoneNumber", "altPhoneNumber", nationality, "maritalStatus", "joiningDate", avatar, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `;
      const insertParams = [
        member.id, member.fullName, member.age, member.dob, member.residence,
        member.gpsAddress, member.phoneNumber, member.altPhoneNumber, member.nationality,
        member.maritalStatus, member.joiningDate, member.avatar, member.createdAt, member.updatedAt
      ];
      await client.query(insertQuery, insertParams);

      // 3. Delete from trash_members
      await client.query('DELETE FROM trash_members WHERE id = $1', [id]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async permanentDelete(id) {
    const memberId = parseInt(id);
    console.log(`[Member.permanentDelete] Deleting member ID ${memberId} from trash`);
    const query = 'DELETE FROM trash_members WHERE id = $1';
    try {
      const result = await pool.query(query, [memberId]);
      console.log(`[Member.permanentDelete] Deleted from trash table, rows affected: ${result.rowCount}`);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`[Member.permanentDelete] ERROR deleting from trash:`, error);
      throw error;
    }
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN age <= 18 THEN 1 ELSE 0 END) as kids,
        SUM(CASE WHEN age > 18 THEN 1 ELSE 0 END) as adults,
        SUM(CASE WHEN LOWER("maritalStatus") = 'single' THEN 1 ELSE 0 END) as singles,
        SUM(CASE WHEN LOWER("maritalStatus") = 'married' THEN 1 ELSE 0 END) as married,
        SUM(CASE WHEN LOWER("maritalStatus") = 'widowed' THEN 1 ELSE 0 END) as widows
      FROM members
    `;
    try {
      const result = await pool.query(query);
      const stats = result.rows[0];
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

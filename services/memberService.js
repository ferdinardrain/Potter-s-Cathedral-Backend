const Member = require('../models/Member');

class MemberService {
  static async getAllMembers(filters = {}) {
    try {
      const members = await Member.findAll(filters);
      return members;
    } catch (error) {
      throw new Error(`Failed to fetch members: ${error.message}`);
    }
  }

  static async getMemberById(id) {
    try {
      const member = await Member.findById(id);
      if (!member) {
        throw new Error('Member not found');
      }
      return member;
    } catch (error) {
      throw error;
    }
  }

  static async createMember(memberData) {
    try {
      const newMember = await Member.create(memberData);
      return newMember;
    } catch (error) {
      throw new Error(`Failed to create member: ${error.message}`);
    }
  }

  static async updateMember(id, memberData) {
    try {
      const updatedMember = await Member.update(id, memberData);
      return updatedMember;
    } catch (error) {
      throw new Error(`Failed to update member: ${error.message}`);
    }
  }

  static async deleteMember(id) {
    try {
      const deleted = await Member.delete(id);
      return deleted;
    } catch (error) {
      throw new Error(`Failed to delete member: ${error.message}`);
    }
  }

  static async restoreMember(id) {
    try {
      const restored = await Member.restore(id);
      return restored;
    } catch (error) {
      throw new Error(`Failed to restore member: ${error.message}`);
    }
  }

  static async permanentlyDeleteMember(id) {
    try {
      const deleted = await Member.permanentDelete(id);
      return deleted;
    } catch (error) {
      throw new Error(`Failed to permanently delete member: ${error.message}`);
    }
  }

  static async getStats() {
    try {
      return await Member.getStats();
    } catch (error) {
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }
  }
}

module.exports = MemberService;

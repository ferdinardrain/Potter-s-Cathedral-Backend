const memberService = require('../services/memberService');

class MemberController {
  static async getAllMembers(req, res) {
    try {
      const { search, maritalStatus, minAge, maxAge, trash } = req.query;
      const filters = {};
      if (search) filters.search = search;
      if (maritalStatus) filters.maritalStatus = maritalStatus;
      if (minAge !== undefined) filters.minAge = minAge;
      if (maxAge !== undefined) filters.maxAge = maxAge;
      if (trash !== undefined) filters.trash = trash;

      const members = await memberService.getAllMembers(filters);
      res.json({ data: members });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getMemberById(req, res) {
    try {
      const { id } = req.params;
      const member = await memberService.getMemberById(id);
      res.json({ data: member });
    } catch (error) {
      if (error.message === 'Member not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  static async createMember(req, res) {
    try {
      const memberData = req.body;
      const newMember = await memberService.createMember(memberData);
      res.status(201).json({ data: newMember });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateMember(req, res) {
    try {
      const { id } = req.params;
      const memberData = req.body;
      const updatedMember = await memberService.updateMember(id, memberData);
      if (!updatedMember) {
        res.status(404).json({ error: 'Member not found' });
      } else {
        res.json({ data: updatedMember });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteMember(req, res) {
    try {
      const { id } = req.params;
      const deleted = await memberService.deleteMember(id);
      if (!deleted) {
        res.status(404).json({ error: 'Member not found' });
      } else {
        res.json({ message: 'Member moved to trash' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async restoreMember(req, res) {
    try {
      const { id } = req.params;
      const restored = await memberService.restoreMember(id);
      if (!restored) {
        res.status(404).json({ error: 'Member not found' });
      } else {
        res.json({ message: 'Member restored successfully' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async permanentlyDeleteMember(req, res) {
    try {
      const { id } = req.params;
      const deleted = await memberService.permanentlyDeleteMember(id);
      if (!deleted) {
        res.status(404).json({ error: 'Member not found' });
      } else {
        res.json({ message: 'Member permanently deleted' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await memberService.getStats();
      res.json({ data: stats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MemberController;

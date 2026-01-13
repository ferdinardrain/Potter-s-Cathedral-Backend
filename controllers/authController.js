const AuthService = require('../services/authService');

class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }

            const result = await AuthService.login(username, password);

            if (!result.success) {
                return res.status(401).json({ error: result.error });
            }

            res.json({
                success: true,
                token: result.token,
                user: result.user
            });
        } catch (error) {
            console.error('Login Error:', error); // Log the full error to server console
            res.status(500).json({
                error: 'Internal Server Error',
                details: error.message, // Send error details to client for debugging
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    static async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const result = await AuthService.verifyTokenAndGetUser(token);

            if (!result.success) {
                return res.status(401).json({ error: result.error });
            }

            res.json({
                success: true,
                user: result.user
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.id; // Set by auth middleware

            if (!oldPassword || !newPassword) {
                return res.status(400).json({ error: 'Old password and new password are required' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'New password must be at least 6 characters' });
            }

            const result = await AuthService.changePassword(userId, oldPassword, newPassword);

            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }

            res.json({ success: true, message: result.message });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async forgotPassword(req, res) {
        try {
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({ error: 'Username is required' });
            }

            const result = await AuthService.requestPasswordReset(username);

            if (!result.success) {
                return res.status(404).json({ error: result.error });
            }

            res.json({
                success: true,
                token: result.token,
                expiresAt: result.expiresAt,
                message: result.message
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async verifyResetToken(req, res) {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({ error: 'Token is required' });
            }

            const result = await AuthService.verifyResetToken(token);

            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }

            res.json({
                success: true,
                username: result.username,
                expiresAt: result.expiresAt
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({ error: 'Token and new password are required' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }

            const result = await AuthService.resetPassword(token, newPassword);

            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }

            res.json({ success: true, message: result.message });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AuthController;

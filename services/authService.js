const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined!');
}
const SALT_ROUNDS = 10;

class AuthService {
    static async hashPassword(password) {
        return await bcrypt.hash(password, SALT_ROUNDS);
    }

    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    static generateToken(user) {
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    static async login(username, password) {
        try {
            // Find admin by username
            const admin = await Admin.findByUsername(username);
            if (!admin) {
                return { success: false, error: 'Invalid username or password' };
            }

            // Compare password
            const isPasswordValid = await this.comparePassword(password, admin.password);
            if (!isPasswordValid) {
                return { success: false, error: 'Invalid username or password' };
            }

            // Generate token
            const token = this.generateToken(admin);

            // Return user info without password
            const { password: _, ...userWithoutPassword } = admin;

            return {
                success: true,
                token,
                user: userWithoutPassword
            };
        } catch (error) {
            console.error('Inner Login Error:', error); // Log the real error (db connection, sql syntax, etc)
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    static async verifyTokenAndGetUser(token) {
        try {
            const decoded = this.verifyToken(token);
            if (!decoded) {
                return { success: false, error: 'Invalid or expired token' };
            }

            // Get fresh user data from database
            const admin = await Admin.findById(decoded.id);
            if (!admin) {
                return { success: false, error: 'User not found' };
            }

            const { password: _, ...userWithoutPassword } = admin;
            return { success: true, user: userWithoutPassword };
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }

    static async changePassword(userId, oldPassword, newPassword) {
        try {
            const admin = await Admin.findById(userId);
            if (!admin) {
                return { success: false, error: 'User not found' };
            }

            // Verify old password
            const isPasswordValid = await this.comparePassword(oldPassword, admin.password);
            if (!isPasswordValid) {
                return { success: false, error: 'Current password is incorrect' };
            }

            // Hash new password
            const hashedPassword = await this.hashPassword(newPassword);

            // Update password
            await Admin.updatePassword(userId, hashedPassword);

            return { success: true, message: 'Password changed successfully' };
        } catch (error) {
            throw new Error(`Password change failed: ${error.message}`);
        }
    }

    static async requestPasswordReset(username) {
        const PasswordReset = require('../models/PasswordReset');

        try {
            // Check if admin exists
            const admin = await Admin.findByUsername(username);
            if (!admin) {
                return { success: false, error: 'Username not found' };
            }

            // Delete any existing reset tokens for this user
            await PasswordReset.deleteByUsername(username);

            // Create new reset token
            const { token, expiresAt } = await PasswordReset.createResetToken(username);

            return {
                success: true,
                token,
                expiresAt,
                message: 'Password reset token generated successfully'
            };
        } catch (error) {
            throw new Error(`Password reset request failed: ${error.message}`);
        }
    }

    static async verifyResetToken(token) {
        const PasswordReset = require('../models/PasswordReset');

        try {
            const resetRequest = await PasswordReset.findByToken(token);

            if (!resetRequest) {
                return { success: false, error: 'Invalid or expired reset token' };
            }

            return {
                success: true,
                username: resetRequest.username,
                expiresAt: resetRequest.expiresAt
            };
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }

    static async resetPassword(token, newPassword) {
        const PasswordReset = require('../models/PasswordReset');

        try {
            // Verify token is valid
            const resetRequest = await PasswordReset.findByToken(token);

            if (!resetRequest) {
                return { success: false, error: 'Invalid or expired reset token' };
            }

            // Get admin
            const admin = await Admin.findByUsername(resetRequest.username);
            if (!admin) {
                return { success: false, error: 'User not found' };
            }

            // Hash new password
            const hashedPassword = await this.hashPassword(newPassword);

            // Update password
            await Admin.updatePassword(admin.id, hashedPassword);

            // Delete the used token
            await PasswordReset.deleteToken(token);

            return { success: true, message: 'Password reset successfully' };
        } catch (error) {
            throw new Error(`Password reset failed: ${error.message}`);
        }
    }
}

module.exports = AuthService;

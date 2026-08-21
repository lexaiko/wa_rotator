import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

export class AuthController {
  // POST /api/auth/login
  static async login(req, res) {
    try {
      const { username, password, remember_me } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username dan password wajib diisi.'
        });
      }

      const cleanUsername = (username || '').trim();
      let user = await prisma.adminUser.findUnique({
        where: { username: cleanUsername }
      });

      if (!user) {
        user = await prisma.adminUser.findFirst({
          where: { username: cleanUsername.toLowerCase() }
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Username atau kata sandi salah.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Username atau password salah.'
        });
      }

      // Update last login
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { last_login_at: new Date() }
      });

      const expiresIn = remember_me ? '30d' : '7d';
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn }
      );

      // Set Secure httpOnly Cookie (CRM-style standard)
      const isHttps = req.secure || (req.headers && req.headers['x-forwarded-proto'] === 'https');
      const isProduction = process.env.NODE_ENV === 'production' && isHttps;
      const maxAgeMs = remember_me ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: maxAgeMs,
        path: '/'
      };

      res.cookie('tb_token', token, cookieOptions);
      res.cookie('token', token, cookieOptions);

      return res.json({
        success: true,
        message: 'Login berhasil!',
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          avatar_url: user.avatar_url,
          last_login_at: new Date()
        }
      });
    } catch (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/auth/logout
  static async logout(req, res) {
    try {
      res.clearCookie('tb_token', { httpOnly: true, path: '/' });
      res.clearCookie('token', { httpOnly: true, path: '/' });
      return res.json({
        success: true,
        message: 'Logout berhasil.'
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/auth/me
  static async getMe(req, res) {
    try {
      return res.json({
        success: true,
        user: req.user
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PUT /api/auth/profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, email, avatar_url, current_password, new_password } = req.body;

      const user = await prisma.adminUser.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'Pengguna tidak ditemukan.' });
      }

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (email !== undefined) updateData.email = email ? email.trim() : null;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

      if (new_password) {
        if (!current_password) {
          return res.status(400).json({
            success: false,
            error: 'Password saat ini diperlukan untuk mengubah password baru.'
          });
        }

        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            error: 'Password saat ini salah.'
          });
        }

        if (new_password.length < 6) {
          return res.status(400).json({
            success: false,
            error: 'Password baru minimal 6 karakter.'
          });
        }

        updateData.password_hash = await bcrypt.hash(new_password, 10);
      }

      const updatedUser = await prisma.adminUser.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          email: true,
          avatar_url: true,
          last_login_at: true,
          updated_at: true
        }
      });

      return res.json({
        success: true,
        message: 'Profil berhasil diperbarui.',
        user: updatedUser
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/auth/users (List all admin users)
  static async getAllUsers(req, res) {
    try {
      const users = await prisma.adminUser.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          email: true,
          avatar_url: true,
          last_login_at: true,
          created_at: true
        },
        orderBy: { created_at: 'asc' }
      });

      return res.json({ success: true, data: users });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export default AuthController;

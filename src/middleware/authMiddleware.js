import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'tripbwi_wa_rotator_jwt_secret_key_2026';

export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // 1. Prioritize secure httpOnly cookie (tb_token or token)
    if (req.cookies && (req.cookies.tb_token || req.cookies.token)) {
      token = req.cookies.tb_token || req.cookies.token;
    }
    // 2. Fallback to Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 3. Fallback to query parameter (e.g. for direct browser downloads)
    else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Akses ditolak: Token autentikasi tidak ditemukan.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.adminUser.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        avatar_url: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Pengguna tidak ditemukan atau sesi telah berakhir.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Sesi login telah kedaluwarsa. Silakan login kembali.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Token tidak valid.'
    });
  }
};

export default authMiddleware;

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { verifyRefreshToken } from '@/lib/auth/jwt';

export async function POST(request) {
  try {
    await connectDB();

    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      // Decode token to get user ID
      const decoded = verifyRefreshToken(refreshToken);
      
      if (decoded) {
        // Remove refresh token from User model
        const user = await User.findById(decoded.id);
        if (user) {
          user.removeRefreshToken(refreshToken);
          await user.save();
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear auth cookies
    return clearAuthCookies(response);
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even if DB operation fails
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
    return clearAuthCookies(response);
  }
}

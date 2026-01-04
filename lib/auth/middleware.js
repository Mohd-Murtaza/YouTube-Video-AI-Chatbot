import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

export async function authMiddleware(request) {
  try {
    // Get access token from httpOnly cookie
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return {
        error: NextResponse.json(
          { success: false, message: 'No access token provided' },
          { status: 401 }
        ),
      };
    }

    const decoded = verifyAccessToken(accessToken);

    if (!decoded) {
      return {
        error: NextResponse.json(
          { success: false, message: 'Invalid or expired access token', needsRefresh: true },
          { status: 401 }
        ),
      };
    }

    // Connect to DB and get user
    await connectDB();
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return {
        error: NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        ),
      };
    }

    return { user };
  } catch (error) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Authentication failed', error: error.message },
        { status: 401 }
      ),
    };
  }
}

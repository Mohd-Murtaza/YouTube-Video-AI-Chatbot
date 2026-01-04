import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { setAuthCookies } from '@/lib/auth/cookies';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide email and password' },
        { status: 400 }
      );
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user registered with OAuth ONLY (no password set yet)
    if (!user.password) {
      return NextResponse.json(
        { 
          success: false, 
          message: user.provider === 'google' 
            ? 'This account was created with Google. You can either:\n1. Sign in using Google, or\n2. Use "Forgot Password" to set a password for email login.'
            : `This account is registered with ${user.provider}. Please sign in using ${user.provider}.`,
          needsPasswordSetup: true, // Flag to show forgot password option in frontend
          provider: user.provider
        },
        { status: 400 }
      );
    }
    
    // If user has password, allow login (even if Google is linked)

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in User model
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await user.addRefreshToken(refreshToken, expiresAt, userAgent, ipAddress);
    await user.save();

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        googleId: user.googleId,
        isVerified: user.isVerified,
      },
    });

    // Set httpOnly cookies
    return setAuthCookies(response, accessToken, refreshToken);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

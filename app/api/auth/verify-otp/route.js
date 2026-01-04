import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { setAuthCookies } from '@/lib/auth/cookies';
import { clearRateLimit } from '@/lib/middleware/rateLimiter';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, otp } = body;

    // Validation
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Please provide email and OTP' },
        { status: 400 }
      );
    }

    // Find user with OTP fields
    const user = await User.findOne({ email }).select('+otp +otpExpiry +otpPurpose');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: 'Email already verified. Please login.' },
        { status: 400 }
      );
    }

    // Verify OTP
    const verification = user.verifyOTP(otp, 'email_verification');
    
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.clearOTP();
    await user.save();

    // Clear rate limit after successful verification
    clearRateLimit(`register_${email}`);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Add refresh token to user
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    user.addRefreshToken(
      refreshToken,
      expiresAt,
      request.headers.get('user-agent'),
      request.headers.get('x-forwarded-for') || request.ip
    );
    await user.save();

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully! Welcome aboard!',
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
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

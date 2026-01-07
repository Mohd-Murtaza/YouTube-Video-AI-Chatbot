import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';

// Verify Google OAuth token
async function verifyGoogleToken(credential) {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const data = await response.json();

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (data.aud !== clientId) {
      throw new Error('Invalid token audience');
    }

    return {
      email: data.email,
      name: data.name,
      googleId: data.sub,
      picture: data.picture,
      email_verified: data.email_verified,
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ success: false, message: 'Credential is required' }, { status: 400 });
    }

    // Verify the Google token
    const googleUser = await verifyGoogleToken(credential);

    if (!googleUser.email_verified) {
      return NextResponse.json(
        { success: false, message: 'Google email not verified' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      // If user exists with local provider, link Google account
      if (user.provider === 'local' && !user.googleId) {
        // Link Google account to existing local account (keep provider as 'local' for dual auth)
        user.googleId = googleUser.googleId;
        // DON'T change provider - allow both password and Google login
        user.profilePicture = user.profilePicture || googleUser.picture; // Use Google picture if no existing picture
        user.isVerified = true; // Verify email since Google verified it
        user.expiresAt = undefined; // Remove expiration - user is now permanent
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save();
    } else {
      // Create new user with Google OAuth
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        provider: 'google',
        isVerified: true, // Google emails are already verified
        profilePicture: googleUser.picture,
        expiresAt: undefined, // Google users are immediately verified, no expiration
      });
    }

    // Generate tokens using helper functions (same as login route)
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    console.log('✅ Tokens generated for user:', user.email);

    // Store refresh token in database
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    user.addRefreshToken(refreshToken, refreshTokenExpiry, userAgent, ipAddress);
    await user.save();
    console.log('✅ Refresh token stored in DB for user:', user.email);

    // Set cookies
    const response = NextResponse.json({
      success: true,
      message: 'Google OAuth successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        profilePicture: user.profilePicture,
        googleId: user.googleId,
        isVerified: user.isVerified,
      },
    });

    // Set httpOnly cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    console.log('✅ Google OAuth Complete! Cookies set for:', user.email);
    return response;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Google OAuth failed' },
      { status: 500 }
    );
  }
}

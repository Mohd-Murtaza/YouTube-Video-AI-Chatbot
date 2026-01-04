import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { clearRateLimit } from '@/lib/middleware/rateLimiter';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, otp, newPassword, confirmPassword } = body;

    // Validation
    if (!email || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Strong password validation
    const passwordErrors = [];
    
    if (newPassword.length < 8) {
      passwordErrors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(newPassword)) {
      passwordErrors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(newPassword)) {
      passwordErrors.push('one lowercase letter');
    }
    if (!/[0-9]/.test(newPassword)) {
      passwordErrors.push('one digit');
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(newPassword)) {
      passwordErrors.push('one special character');
    }
    if (/^\s+$/.test(newPassword)) {
      return NextResponse.json(
        { success: false, message: 'Password cannot contain only spaces' },
        { status: 400 }
      );
    }

    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Password must contain ${passwordErrors.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Find user with OTP fields
    const user = await User.findOne({ email }).select('+otp +otpExpiry +otpPurpose +password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify OTP
    const verification = user.verifyOTP(otp, 'password_reset');
    
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
    }

    // Update password
    user.password = newPassword;
    user.clearOTP();
    
    // Logout all devices (remove all refresh tokens for security)
    user.removeAllRefreshTokens();
    
    await user.save();

    // Clear rate limit after successful reset
    clearRateLimit(`forgot_password_${email}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successful! Please login with your new password.',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

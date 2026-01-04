import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { sendOTPEmail } from '@/lib/email/nodemailer';
import { checkRateLimit, rateLimitResponse } from '@/lib/middleware/rateLimiter';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    // Rate limiting - 3 requests per 15 minutes per email
    const rateLimit = checkRateLimit(`forgot_password_${email}`, 3, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.remainingTime);
    }

    // Validation
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Please provide email' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists or not (security)
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, you will receive an OTP shortly',
      });
    }

    // Allow all users (including Google users) to set/reset password via OTP
    // This enables Google users to add password login as an additional auth method

    // Generate OTP
    const otp = user.generateOTP('password_reset');
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, user.name, 'password_reset');
    
    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email. Valid for 15 minutes.',
      email: email,
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

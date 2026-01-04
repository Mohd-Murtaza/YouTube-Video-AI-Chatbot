import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { sendOTPEmail } from '@/lib/email/nodemailer';
import { checkRateLimit, rateLimitResponse } from '@/lib/middleware/rateLimiter';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password } = body;

    // Rate limiting - 3 requests per 15 minutes per email
    const rateLimit = checkRateLimit(`register_${email}`, 3, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.remainingTime);
    }

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Strong password validation
    const passwordErrors = [];
    
    if (password.length < 8) {
      passwordErrors.push('at least 8 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push('one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      passwordErrors.push('one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      passwordErrors.push('one digit');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) {
      passwordErrors.push('one special character (!@#$%^&*...)');
    }

    if (/^\s+$/.test(password)) {
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but not verified, allow resending OTP
      if (!existingUser.isVerified) {
        // Generate new OTP
        const otp = existingUser.generateOTP('email_verification');
        await existingUser.save();

        // Send OTP email
        const emailResult = await sendOTPEmail(email, otp, name, 'email_verification');
        
        if (!emailResult.success) {
          return NextResponse.json(
            { success: false, message: 'Failed to send OTP email' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'User already exists but not verified. New OTP sent to your email',
          requiresOTP: true,
          email: email,
        });
      }

      return NextResponse.json(
        { success: false, message: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Create user (not saved yet - waiting for OTP verification)
    const user = new User({
      name,
      email,
      password,
      isVerified: false,
    });

    // Generate OTP
    const otp = user.generateOTP('email_verification');
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name, 'email_verification');
    
    if (!emailResult.success) {
      // Delete user if email failed
      await User.deleteOne({ _id: user._id });
      return NextResponse.json(
        { success: false, message: 'Failed to send OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      requiresOTP: true,
      email: email,
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

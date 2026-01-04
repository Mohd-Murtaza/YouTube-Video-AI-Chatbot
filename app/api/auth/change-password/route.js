import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { authMiddleware } from '@/lib/auth/middleware';

export async function POST(request) {
  try {
    await connectDB();

    // Check authentication
    const { user: authUser, error } = await authMiddleware(request);
    if (error) return error;

    const body = await request.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'New passwords do not match' },
        { status: 400 }
      );
    }

    // Check if new password is same as old password
    if (oldPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: 'New password must be different from old password' },
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

    // Get user with password
    const user = await User.findById(authUser.id).select('+password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is OAuth user (no password to change)
    if (user.provider === 'google' || !user.password) {
      return NextResponse.json(
        { success: false, message: 'Cannot change password for Google Sign-In accounts' },
        { status: 400 }
      );
    }

    // Verify old password
    const isOldPasswordCorrect = await user.comparePassword(oldPassword);
    
    if (!isOldPasswordCorrect) {
      return NextResponse.json(
        { success: false, message: 'Old password is incorrect' },
        { status: 400 }
      );
    }

    // Update password
    user.password = newPassword;
    
    // Optional: Keep current device logged in, logout others
    // Or logout all devices for maximum security
    // user.removeAllRefreshTokens(); // Uncomment to logout all devices
    
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully!',
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

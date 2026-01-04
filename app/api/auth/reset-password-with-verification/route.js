import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();

    const { email, oldPassword, newPassword, confirmPassword } = await request.json();

    // Validate all fields
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "New passwords do not match" },
        { status: 400 }
      );
    }

    // Check if old and new passwords are same
    if (oldPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: "New password must be different from old password" },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one digit, and one special character",
        },
        { status: 400 }
      );
    }

    // Find user by email and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user has a password (not Google OAuth user)
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          message: "This account uses Google sign-in. Please reset your password using Google.",
        },
        { status: 400 }
      );
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update password (will be hashed by pre-save hook in User model)
    user.password = newPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

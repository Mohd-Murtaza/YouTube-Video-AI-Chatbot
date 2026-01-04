import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      index: true, // Index for faster email lookups
    },
    password: {
      type: String,
      minlength: 8,
      select: false, // Don't return password by default
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true, // Index for faster Google ID lookups
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    // OTP for email verification and password reset
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    otpPurpose: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      select: false,
    },
    // Expiration timestamp for unverified users
    // Will be removed once user is verified
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      index: { expires: 0 }, // TTL index - MongoDB will auto-delete when expiresAt is reached
    },
    // Refresh tokens stored as array (no separate model needed)
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
          index: true, // Index for faster token lookups
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        userAgent: String,
        ipAddress: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  // Only hash password if it's modified AND exists (OAuth users may not have password)
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate 6-digit OTP
userSchema.methods.generateOTP = function (purpose = 'email_verification') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  this.otpPurpose = purpose;
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (inputOTP, purpose) {
  if (!this.otp || !this.otpExpiry || !this.otpPurpose) {
    return { valid: false, message: 'No OTP found' };
  }

  if (this.otpPurpose !== purpose) {
    return { valid: false, message: 'OTP purpose mismatch' };
  }

  if (Date.now() > this.otpExpiry) {
    return { valid: false, message: 'OTP expired' };
  }

  if (this.otp !== inputOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }

  return { valid: true };
};

// Clear OTP after verification
userSchema.methods.clearOTP = function () {
  this.otp = undefined;
  this.otpExpiry = undefined;
  this.otpPurpose = undefined;
};

// Mark user as verified and remove expiration (prevent TTL deletion)
userSchema.methods.markAsVerified = function () {
  this.isVerified = true;
  this.expiresAt = undefined; // Remove expiration - user is now permanent
};

// Add refresh token (with auto-cleanup of expired tokens)
userSchema.methods.addRefreshToken = function (token, expiresAt, userAgent, ipAddress) {
  // Auto-cleanup expired tokens before adding new one (no cron job needed)
  const now = Date.now();
  this.refreshTokens = this.refreshTokens.filter((t) => t.expiresAt > now);
  
  // Add new token
  this.refreshTokens.push({
    token,
    expiresAt,
    userAgent,
    ipAddress,
  });
};

// Remove expired tokens
userSchema.methods.cleanupExpiredTokens = function () {
  this.refreshTokens = this.refreshTokens.filter(
    (token) => token.expiresAt > Date.now()
  );
};

// Remove specific token (logout)
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((t) => t.token !== token);
};

// Remove all tokens (logout all devices)
userSchema.methods.removeAllRefreshTokens = function () {
  this.refreshTokens = [];
};

export default mongoose.models.User || mongoose.model('User', userSchema);

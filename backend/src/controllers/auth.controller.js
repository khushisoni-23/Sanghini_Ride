import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Otp from '../models/Otp.js';
import TrustedContact from '../models/TrustedContact.js';
import Notification from '../models/Notification.js';
import generateToken, { setTokenCookie, clearTokenCookie } from '../utils/generateToken.js';
import { sendOtpEmail, sendWelcomeEmail } from '../services/email.service.js';
import { validateAadhaarNumber } from '../utils/aadhaarValidator.js';

// Strict validation patterns
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;

/**
 * @desc    Send 6-digit OTP to user's real email
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
export const sendOtp = async (req, res, next) => {
  try {
    const { email, phone, name } = req.body;

    // 1. Validation
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    if (phone) {
      const cleanPhone = phone.replace(/[\s-]/g, '');
      if (!PHONE_REGEX.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).',
        });
      }
    }

    // 2. Check if user already registered
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    if (phone) {
      const cleanPhone = phone.replace(/[\s-]/g, '').slice(-10);
      const existingPhone = await User.findOne({ phone: { $regex: cleanPhone + '$' } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'An account with this phone number already exists. Please log in.',
        });
      }
    }

    // 3. Generate secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Upsert OTP in MongoDB with 10 min TTL
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase().trim(), purpose: 'registration' },
      {
        $set: {
          otp: generatedOtp,
          phone: phone ? phone.trim() : undefined,
          verified: false,
          attempts: 0,
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 5. Send real email via Nodemailer
    await sendOtpEmail(email.toLowerCase().trim(), generatedOtp, name || 'Sanghini Rider');

    console.log(`🔑 Verification OTP [${generatedOtp}] sent to: ${email}`);

    import('../config/env.js').then(({ default: env }) => {
      res.status(200).json({
        success: true,
        message: `A 6-digit verification code has been sent to ${email}.`,
        expiresInMinutes: 10,
        ...(env.isDevelopment && { devOtp: generatedOtp }),
      });
    });
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    next(error);
  }
};

/**
 * @desc    Verify OTP and create verified user account
 * @route   POST /api/auth/verify-otp-register
 * @access  Public
 */
export const verifyOtpAndRegister = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, gender, otp } = req.body;

    // 1. Basic validation
    if (!name || !email || !phone || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields including the 6-digit OTP code.',
      });
    }

    // 2. Validate email and phone formats
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.replace(/[\s-]/g, '').slice(-10);

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian phone number.',
      });
    }

    // 3. KYC Gender Check — Sanghini is a strict women-only platform
    const declaredGender = (gender || 'female').toLowerCase().trim();
    if (['male', 'man', 'boy', 'm'].includes(declaredGender)) {
      return res.status(403).json({
        success: false,
        message: 'Registration Rejected: Sanghini Ride is an exclusive Women-Only mobility platform. Male accounts are not permitted.',
      });
    }

    // 4. Genuine Aadhaar KYC Validation (Verhoeff Algorithm Check)
    const aadhaarInput = req.body.aadhaarNumber || req.body.aadhaar;
    if (aadhaarInput) {
      const isValidAadhaar = validateAadhaarNumber(aadhaarInput);
      if (!isValidAadhaar) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Aadhaar Card Number! Please enter a genuine 12-digit Indian Aadhaar card number passing UIDAI checksum verification.',
        });
      }
    }

    // 3. Verify OTP in database
    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose: 'registration',
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Verification code not found or expired. Please request a new code.',
      });
    }

    if (otpRecord.otp !== otp.trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please check your email and try again.',
      });
    }

    // 4. Check for existing user (double-check before insert)
    const existing = await User.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanPhone }],
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email or phone number already exists.',
      });
    }

    // 5. Create verified user
    const userRole = role === 'driver' ? 'driver' : 'passenger';
    const finalGender = declaredGender === 'other' ? 'other' : 'female';
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash: password,
      role: userRole,
      gender: finalGender,
      isVerified: true, // Verified via real OTP
    });

    // 6. Create Driver profile if role is driver
    if (userRole === 'driver') {
      await Driver.create({
        user: user._id,
        licenseNumber: req.body.licenseNumber || 'PENDING-' + Date.now(),
        licenseExpiry: req.body.licenseExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        verificationStatus: 'pending',
      });
    }

    // 7. Delete consumed OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // 8. Send welcome email in background
    sendWelcomeEmail(cleanEmail, user.name, userRole).catch((err) =>
      console.warn('Welcome email error:', err.message)
    );

    // 9. Generate token & set cookie
    const token = generateToken({ userId: user._id, role: user.role });
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created and verified successfully!',
      user: user.toSafeProfile(),
      token,
    });
  } catch (error) {
    console.error('❌ Error verifying OTP and registering:', error);
    next(error);
  }
};

/**
 * @desc    Register new passenger or driver
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, gender, otp, adminSecret } = req.body;

    // Secure Admin Provisioning: If valid adminSecret provided, create verified admin directly
    if (role === 'admin' && adminSecret) {
      import('../config/env.js').then(async ({ default: env }) => {
        if (adminSecret !== env.ADMIN_SECRET) {
          return res.status(403).json({ success: false, message: 'Invalid admin secret authorization.' });
        }
        const cleanEmail = email.toLowerCase().trim();
        const cleanPhone = phone ? phone.replace(/[\s-]/g, '').slice(-10) : '9999999999';
        let user = await User.findOne({ email: cleanEmail });
        if (!user) {
          user = await User.create({
            name: name || 'Sanghini Admin',
            email: cleanEmail,
            phone: cleanPhone,
            passwordHash: password,
            role: 'admin',
            gender: gender || 'female',
            isVerified: true,
            isActive: true,
          });
        }
        const token = generateToken({ userId: user._id, role: 'admin' });
        setTokenCookie(res, token);
        return res.status(201).json({
          success: true,
          message: 'Admin account provisioned successfully',
          user: user.toSafeProfile(),
          token,
        });
      });
      return;
    }

    // Strict security: OTP is mandatory for all standard registrations
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Email verification code (OTP) is required. Please verify your real email address before registering.',
      });
    }

    return verifyOtpAndRegister(req, res, next);
  } catch (error) {
    console.error('❌ Registration Error:', error);
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, phone, password, identifier } = req.body;
    const loginIdentifier = (email || phone || identifier || '').trim();

    // 1. Validate request
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered Email/Phone and Password.',
      });
    }

    // 2. Determine whether identifier is Phone (10-digit Indian number) or Email
    const cleanDigits = loginIdentifier.replace(/[\s-+]/g, '');
    const isPhoneNumber = /^(?:91)?[6-9]\d{9}$/.test(cleanDigits);

    let query = {};
    if (isPhoneNumber) {
      const tenDigitPhone = cleanDigits.slice(-10);
      query = { phone: { $regex: tenDigitPhone + '$' } };
    } else {
      query = { email: loginIdentifier.toLowerCase() };
    }

    // 3. Find user (including passwordHash, isActive, and isVerified)
    const user = await User.findOne(query).select('+passwordHash +isActive +isVerified');

    // 4. Block non-existent or fake accounts
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Fake or unregistered accounts cannot log in. Please register first.',
      });
    }

    // 5. Verify password
    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.',
      });
    }

    // 6. Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.',
      });
    }

    // 7. CRITICAL SECURITY: Block unverified accounts (real OTP verification mandatory)
    if (user.role !== 'admin' && user.isVerified === false) {
      return res.status(403).json({
        success: false,
        message: 'Unverified Account: Only verified real accounts can log in. Please complete OTP verification.',
      });
    }

    // 8. Generate token & set cookie
    const token = generateToken({ userId: user._id, role: user.role });
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: user.toSafeProfile(),
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is set in protect middleware
    res.status(200).json({
      success: true,
      user: req.user.toSafeProfile(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin creation seeder (Development only)
 * @route   POST /api/auth/admin-seed
 * @access  Public (protected by secret)
 */
export const seedAdmin = async (req, res, next) => {
  try {
    const { secret, name, email, phone, password } = req.body;

    // A basic protection to prevent public admin creation
    if (secret !== process.env.JWT_SECRET) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const adminExists = await User.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }

    const admin = await User.create({
      name,
      email,
      phone,
      passwordHash: password,
      role: 'admin',
      isVerified: true
    });

    res.status(201).json({ success: true, message: 'Admin created successfully', user: admin.toSafeProfile() });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile in MongoDB
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, city, profilePhoto } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (city) user.city = city.trim();
    if (profilePhoto) user.profilePhoto = profilePhoto;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully in MongoDB.',
      user: user.toSafeProfile(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete logged in user's account permanently from MongoDB
 * @route   DELETE /api/auth/account
 * @access  Private
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Delete associated Driver profile if driver
    await Driver.deleteMany({ user: userId });

    // Delete associated trusted contacts & notifications
    await TrustedContact.deleteMany({ user: userId });
    await Notification.deleteMany({ recipient: userId });

    // Delete User document from MongoDB
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Clear authentication cookie
    clearTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: 'Your account has been permanently deleted from Sanghini MongoDB database.',
    });
  } catch (error) {
    console.error('❌ Error deleting user account:', error);
    next(error);
  }
};


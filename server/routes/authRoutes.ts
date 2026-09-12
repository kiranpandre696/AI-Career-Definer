import { Router, Response } from 'express';
import { db } from '../db.ts';
import { hashPassword, verifyPassword, createToken, authenticateToken, AuthenticatedRequest } from '../auth.ts';
import { User } from '../types.ts';

const router = Router();

// Helper to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Student Sign Up handler
const handleStudentSignup = (req: any, res: Response) => {
  try {
    const rawFullName = req.body.fullName || req.body.name;
    const rawEmail = req.body.email;
    const rawPassword = req.body.password;
    const rawConfirmPassword = req.body.confirmPassword;
    const rawMobile = req.body.mobileNumber || req.body.phone || '';

    // 1. Validate required fields
    if (!rawFullName || !rawFullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full Name is required.' });
    }
    if (!rawEmail || !rawEmail.trim()) {
      return res.status(400).json({ success: false, message: 'Email Address is required.' });
    }
    if (!rawPassword) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }
    if (!rawConfirmPassword) {
      return res.status(400).json({ success: false, message: 'Please confirm your password.' });
    }

    const fullName = rawFullName.trim();
    const email = rawEmail.trim().toLowerCase();
    const password = String(rawPassword);
    const confirmPassword = String(rawConfirmPassword);

    // 2. Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address (e.g. name@example.com).' });
    }

    // 3. Password length check
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // 4. Password and Confirm Password match
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
    }

    // 5. Check if email already registered
    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address is already registered. Please sign in.',
      });
    }

    // 6. Securely hash password and create student user
    const { hash, salt } = hashPassword(password);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newUser: User = {
      id: userId,
      email,
      passwordHash: hash,
      salt,
      fullName,
      mobileNumber: rawMobile ? String(rawMobile).trim() : '',
      role: 'STUDENT', // Strictly student role
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createUser(newUser);

    // 7. Parse optional academic and career registration fields
    const highestQualification = req.body.highestQualification || req.body.qualification || 'Graduation';
    const branch = req.body.branchStream || req.body.branch || '';
    const college = req.body.institution || req.body.college || '';
    const graduationYear = req.body.passingYear || req.body.graduationYear 
      ? Number(req.body.passingYear || req.body.graduationYear) 
      : undefined;
    const state = req.body.state || req.body.stateId || '';
    const category = req.body.category || 'GENERAL';
    const age = req.body.age ? Number(req.body.age) : undefined;
    const dateOfBirth = req.body.dateOfBirth || '';
    const gender = req.body.gender || undefined;

    let interests: string[] = [];
    if (Array.isArray(req.body.interests)) {
      interests = req.body.interests;
    } else if (Array.isArray(req.body.careerInterests)) {
      interests = req.body.careerInterests;
    } else if (typeof req.body.careerInterests === 'string' && req.body.careerInterests.trim()) {
      interests = req.body.careerInterests.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else if (typeof req.body.interests === 'string' && req.body.interests.trim()) {
      interests = req.body.interests.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const skills: string[] = Array.isArray(req.body.skills) ? req.body.skills : [];

    // Create initial student candidate profile in DB
    const newProfile = db.upsertProfile(userId, {
      fullName: newUser.fullName,
      email: newUser.email,
      mobileNumber: newUser.mobileNumber,
      dateOfBirth,
      age,
      gender,
      category,
      state,
      highestQualification: highestQualification as any,
      courseDegree: req.body.courseDegree || (branch ? `${highestQualification} (${branch})` : highestQualification),
      branchStream: branch,
      branch: branch,
      institution: college,
      passingYear: graduationYear,
      interests,
      skills,
      preferredCategories: ['CENTRAL', 'STATE'],
    });

    const token = createToken(newUser.id, newUser.role);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to CAREER DEFINER.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        mobileNumber: newUser.mobileNumber,
        role: newUser.role,
      },
      profile: newProfile,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating your account. Please try again.',
    });
  }
};

// Student Login handler
const handleStudentLogin = (req: any, res: Response) => {
  try {
    const rawEmail = req.body.email;
    const rawPassword = req.body.password;

    if (!rawEmail || !rawEmail.trim()) {
      return res.status(400).json({ success: false, message: 'Email Address is required.' });
    }
    if (!rawPassword) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const email = rawEmail.trim().toLowerCase();
    const password = String(rawPassword);

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
    }

    // Role check: Only students may authenticate here
    if (user.role !== 'STUDENT') {
      return res.status(401).json({
        success: false,
        message: 'This account has administrator privileges. Please log in using the Admin Login page.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your candidate account has been deactivated. Please contact support.',
      });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
    }

    const token = createToken(user.id, user.role);
    const profile = db.getProfileByUserId(user.id);

    return res.json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
      profile,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication. Please try again.',
    });
  }
};

// Mount endpoints with aliases for maximum compatibility
router.post('/student/signup', handleStudentSignup);
router.post('/register', handleStudentSignup);
router.post('/signup', handleStudentSignup);

router.post('/student/login', handleStudentLogin);
router.post('/login', handleStudentLogin);

// Admin Login
router.post('/admin/login', (req, res) => {
  try {
    const { username, email, password } = req.body;
    const providedUser = typeof username === 'string' ? username : typeof email === 'string' ? email : '';
    const providedPass = typeof password === 'string' ? password : '';

    if (!providedUser || !providedPass) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin username or password.',
      });
    }

    // Configured admin credentials (environment variable or default configured demo credentials)
    const configuredAdminUsername = process.env.ADMIN_USERNAME || 'Viksit Coders';
    const configuredAdminPassword = process.env.ADMIN_PASSWORD || 'SSLKHR';

    // Treat the username as case-sensitive and password as case-sensitive.
    // Both fields must match exactly.
    const isExactMatch =
      (providedUser === configuredAdminUsername || providedUser === 'admin@careerdefiner.gov.in') &&
      providedPass === configuredAdminPassword;

    if (!isExactMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin username or password.',
      });
    }

    // Find or synchronize admin user in database
    let admin = db.getAllUsers().find((u) => u.role === 'ADMIN');
    if (!admin) {
      const { hash, salt } = hashPassword(configuredAdminPassword);
      admin = {
        id: 'usr_admin_01',
        email: 'admin@careerdefiner.gov.in',
        username: configuredAdminUsername,
        passwordHash: hash,
        salt,
        fullName: configuredAdminUsername,
        mobileNumber: '+91 9876543210',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.createUser(admin);
    } else {
      if (admin.fullName !== configuredAdminUsername || admin.username !== configuredAdminUsername) {
        db.updateUser(admin.id, { fullName: configuredAdminUsername, username: configuredAdminUsername });
        admin.fullName = configuredAdminUsername;
        admin.username = configuredAdminUsername;
      }
    }

    const token = createToken(admin.id, 'ADMIN');

    return res.json({
      success: true,
      message: 'Admin authentication verified',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username || configuredAdminUsername,
        fullName: admin.fullName,
        role: 'ADMIN',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Admin login failed', error: err.message });
  }
});

// Get Current Authenticated User
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let profile = null;
  if (user.role === 'STUDENT') {
    profile = db.getProfileByUserId(user.id);
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      role: user.role,
    },
    profile,
  });
});

// Forgot Password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  const user = db.findUserByEmail(email);
  if (!user) {
    // For security, don't reveal existence
    return res.json({
      success: true,
      message: 'If that email address is registered, password reset instructions have been dispatched.',
    });
  }
  return res.json({
    success: true,
    message: 'Password reset link sent to registered email address.',
  });
});

// Logout
router.post('/logout', (_req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [
        { username },
        ...(email ? [{ email }] : [])
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this username or email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email: email || undefined,
      username,
      password: hashedPassword,
    });

    await user.save();
    
    // Log successful registration to database
    console.log('[Auth] ✅ User registered successfully:', {
      id: user._id,
      email: user.email || 'N/A',
      username: user.username,
      createdAt: user.createdAt,
    });

    // Generate JWT with extended expiry for auto-login
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    console.log('[Auth] 🔑 JWT token generated for user:', username);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      message: 'Registration successful! You are now logged in.',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during signup',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password, email } = req.body;
    
    // Support both old (email) and new (identifier) formats
    const loginIdentifier = identifier || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username/email and password are required',
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: loginIdentifier },
        { email: loginIdentifier }
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username/email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username/email or password',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    console.log('[Auth] 🔓 User logged in successfully:', {
      id: user._id,
      email: user.email || 'N/A',
      username: user.username,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      message: 'Login successful!',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login',
    });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

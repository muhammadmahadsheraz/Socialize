import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { userService } from '../services/userService';
import { subscriptionService } from '../services/subscriptionService';
import jwt from 'jsonwebtoken';

const router = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google/verify
 * Verify Google ID token and sign in / sign up user
 * Frontend sends the ID token from Google Sign-In
 */
router.post('/google/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ success: false, message: 'ID token is required' });
      return;
    }

    // Verify the token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      res.status(401).json({ success: false, message: 'Invalid Google ID token' });
      return;
    }

    const email = payload.email;
    const fullname = payload.name || 'User';
    const profilePic = payload.picture;

    if (!email) {
      res.status(401).json({ success: false, message: 'No email found in Google token' });
      return;
    }

    // Check if user already exists
    let user = await userService.getUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      // New user — create account with Google data
      isNewUser = true;
      const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      user = await userService.createUser({
        fullname,
        email,
        phoneNumber: '+00000000000', // placeholder
        password: randomPassword,
        profilePic: profilePic || undefined,
      });

      // Auto-create free subscription
      await subscriptionService.createFreeSubscription(user._id.toString());
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as any
    );

    res.status(200).json({
      success: true,
      message: isNewUser ? 'User created and signed in' : 'User signed in',
      token,
      user: userService.formatUserResponse(user),
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Google authentication failed',
    });
  }
});

export default router;

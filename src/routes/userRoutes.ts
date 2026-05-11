import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { subscriptionService } from '../services/subscriptionService';
import { validateRequest } from '../middlewares/validation';
import { protect } from '../middlewares/auth';
import { createUserSchema, updateUserSchema, loginSchema } from '../validations/userValidation';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * POST /api/users/register  — public
 * POST /api/users/login     — public
 * GET  /api/users/:id       — protected
 * PUT  /api/users/:id       — protected
 * DELETE /api/users/:id     — protected
 * POST /api/users/:id/favourite-places   — protected
 * DELETE /api/users/:id/favourite-places — protected
 */

/**
 * POST /api/users/register
 * Register a new user
 */
router.post('/register', validateRequest(createUserSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.createUser(req.body);

    // Auto-create a free subscription on registration
    await subscriptionService.createFreeSubscription(user._id.toString());

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as any
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userService.formatUserResponse(user),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
});

/**
 * POST /api/users/login
 * Login a user
 */
router.post('/login', validateRequest(loginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await userService.getUserByEmail(email);

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as any
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userService.formatUserResponse(user),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: userService.formatUserResponse(user),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch user',
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', protect, validateRequest(updateUserSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: userService.formatUserResponse(user),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    await userService.deleteUser(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete user',
    });
  }
});

/**
 * POST /api/users/:id/favourite-places
 * Add a favourite place
 */
router.post('/:id/favourite-places', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { place } = req.body;

    if (!place) {
      res.status(400).json({ success: false, message: 'Place is required' });
      return;
    }

    const user = await userService.addFavouritePlace(req.params.id, place);

    res.status(200).json({
      success: true,
      message: 'Favourite place added',
      user: userService.formatUserResponse(user),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add favourite place',
    });
  }
});

/**
 * DELETE /api/users/:id/favourite-places
 * Remove a favourite place
 */
router.delete('/:id/favourite-places', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { place } = req.body;

    if (!place) {
      res.status(400).json({ success: false, message: 'Place is required' });
      return;
    }

    const user = await userService.removeFavouritePlace(req.params.id, place);

    res.status(200).json({
      success: true,
      message: 'Favourite place removed',
      user: userService.formatUserResponse(user),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove favourite place',
    });
  }
});

export default router;

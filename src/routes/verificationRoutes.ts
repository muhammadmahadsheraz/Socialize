import { Router, Request, Response, NextFunction } from 'express';
import { evaluateRisk } from '../services/riskEngine';
import VerificationRecord from '../models/VerificationRecord';
import { User } from '../models/User';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Failed risk checks are not persisted, so users can retry with corrected OCR input.
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rawOcrText } = req.body;
    const userId = (req as any).userId;

    if (!rawOcrText || typeof rawOcrText !== 'string') {
      res.status(400).json({ success: false, message: 'rawOcrText is required in the request body' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const existingRecord = await VerificationRecord.findOne({ userId: user._id });
    if (existingRecord) {
      res.status(400).json({
        success: false,
        message: 'User already has a verification record.',
        verificationRecordId: existingRecord._id,
      });
      return;
    }

    const expectedName = user.fullname || '';
    const { riskScore, violations, nationalId, fullName, dateOfBirth, detectedCountry } = evaluateRisk(rawOcrText, expectedName);
    const isApproved = riskScore >= 0.8;

    if (!isApproved) {
      res.status(400).json({
        success: false,
        message: 'ID Verification failed based on risk analysis.',
        violations,
        riskScore,
        detectedCountry,
      });
      return;
    }

    const verificationRecord = new VerificationRecord({
      userId: user._id,
      nationalId,
      fullName,
      dateOfBirth,
      rawOcrText,
      riskScore,
      violations,
      status: 'approved',
    });
    await verificationRecord.save();

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User successfully verified',
      data: {
        userId: user._id,
        isVerified: user.isVerified,
        verificationRecordId: verificationRecord._id,
        detectedCountry,
        riskScore,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:recordId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { recordId } = req.params;
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, message: 'userId is required in body' });
      return;
    }
    const record = await VerificationRecord.findById(recordId);
    if (!record) {
      res.status(404).json({ success: false, message: 'Verification record not found' });
      return;
    }
    if (record.userId.toString() !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this record' });
      return;
    }
    await record.deleteOne();
    res.status(200).json({ success: true, message: 'Verification record deleted' });
  } catch (e) {
    next(e);
  }
});

router.patch('/:recordId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { recordId } = req.params;
    const { userId, rawOcrText } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, message: 'userId is required in body' });
      return;
    }
    if (!rawOcrText) {
      res.status(400).json({ success: false, message: 'rawOcrText is required to update' });
      return;
    }
    const record = await VerificationRecord.findById(recordId);
    if (!record) {
      res.status(404).json({ success: false, message: 'Verification record not found' });
      return;
    }
    if (record.userId.toString() !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized to update this record' });
      return;
    }
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    const expectedName = user.fullname || '';
    const { riskScore, violations, nationalId, fullName, dateOfBirth, detectedCountry } = evaluateRisk(rawOcrText, expectedName);
    const isApproved = riskScore >= 0.8;
    const status = isApproved ? 'approved' : 'rejected';

    record.rawOcrText = rawOcrText;
    record.nationalId = nationalId;
    record.fullName = fullName;
    record.dateOfBirth = dateOfBirth ?? undefined;
    record.riskScore = riskScore;
    record.violations = violations;
    record.status = status;
    await record.save();

    if (isApproved && !user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Verification record updated',
      data: { verificationRecordId: record._id, status, riskScore, detectedCountry },
    });
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.query as { userId?: string };
    const filter = userId ? { userId } : {};
    const records = await VerificationRecord.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (e) {
    next(e);
  }
});

router.get('/:recordId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { recordId } = req.params;
    const { userId } = req.query as { userId?: string };
    const record = await VerificationRecord.findById(recordId);
    if (!record) {
      res.status(404).json({ success: false, message: 'Verification record not found' });
      return;
    }
    if (userId && record.userId.toString() !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized to view this record' });
      return;
    }
    res.status(200).json({ success: true, data: record });
  } catch (e) {
    next(e);
  }
});

export default router;

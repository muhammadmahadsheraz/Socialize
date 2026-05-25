import vision from '@google-cloud/vision';
import path from 'path';

const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../../vibecheck-495614-8b1ab9decfaa.json');

const client = new vision.ImageAnnotatorClient({
  keyFilename,
});

export const verifyIdCard = async (imagePath: string): Promise<string | null> => {
  try {
    const [result] = await client.textDetection(imagePath);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return null;
    }

    return detections[0].description || null;
  } catch (error: any) {
    console.error('Error verifying ID card with Vision API:', error);
    if (error.code === 7) {
        throw new Error('Google Cloud Vision API billing not enabled or permission denied.');
    }
    throw new Error('Failed to process image with OCR service.');
  }
};

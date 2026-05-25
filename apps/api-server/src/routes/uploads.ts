import { Router, Response } from 'express';
import { prisma } from '@bytearena/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();

// POST /api/uploads - Upload a file (base64 data URI) to Cloudinary
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { fileDataUri, folder, type } = req.body;

    if (!fileDataUri) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(fileDataUri, {
      folder: folder || 'bytearena/uploads',
      resource_type: 'auto',
    });

    // If the upload is for a profile image or resume, update the user record
    if (type === 'profileImage') {
      await prisma.user.update({
        where: { id: userId },
        data: { imageUrl: uploadResult.secure_url }
      });
    } else if (type === 'resume') {
      await prisma.user.update({
        where: { id: userId },
        data: { resumeUrl: uploadResult.secure_url }
      });
    }

    return res.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (it automatically picks up CLOUDINARY_URL from env)

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { contestId, imageBase64 } = body;

    if (!contestId || !imageBase64) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageBase64, {
      folder: `bytearena/snapshots/${contestId}`,
      resource_type: 'image'
    });

    // Save to DB
    const snapshot = await prisma.snapshot.create({
      data: {
        userId,
        contestId,
        imageUrl: uploadResult.secure_url
      }
    });

    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error('Error uploading snapshot:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

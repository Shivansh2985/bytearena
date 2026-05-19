import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { fileDataUri, folder } = body;

    if (!fileDataUri) {
      return NextResponse.json({ error: 'No file data provided' }, { status: 400 });
    }

    const uploadResult: any = await uploadToCloudinary(fileDataUri, folder || 'bytearena/uploads');

    return NextResponse.json({ 
      url: uploadResult.secure_url, 
      publicId: uploadResult.public_id 
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

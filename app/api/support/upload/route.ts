import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Please log in to upload files.' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 }
            );
        }

        if (files.length > 3) {
            return NextResponse.json(
                { error: 'Maximum 3 files allowed' },
                { status: 400 }
            );
        }

        // Validate files
        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                return NextResponse.json(
                    { error: `File type ${file.type} not allowed. Only JPG, PNG, and PDF are supported.` },
                    { status: 400 }
                );
            }

            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: `File ${file.name} exceeds 5MB limit` },
                    { status: 400 }
                );
            }
        }

        const uploadedUrls: string[] = [];

        // Upload each file to Supabase storage
        for (const file of files) {
            const fileName = `${user.id}/${Date.now()}-${file.name}`;
            const buffer = await file.arrayBuffer();

            const { data, error } = await supabase.storage
                .from('support-attachments')
                .upload(fileName, buffer, {
                    contentType: file.type,
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) {
                console.error('Upload error:', error);
                // If this is the first file and it fails, return error
                // If subsequent files fail, just log and continue
                if (uploadedUrls.length === 0) {
                    return NextResponse.json(
                        { error: 'Failed to upload file. Please ensure the storage bucket is configured.' },
                        { status: 500 }
                    );
                }
                continue;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('support-attachments')
                .getPublicUrl(data.path);

            uploadedUrls.push(publicUrl);
        }

        return NextResponse.json({
            data: {
                urls: uploadedUrls,
            },
            message: `${uploadedUrls.length} file(s) uploaded successfully`,
        });
    } catch (error) {
        console.error('POST /api/support/upload error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to upload files' },
            { status: 500 }
        );
    }
}

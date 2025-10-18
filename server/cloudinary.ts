import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req: any, file: any) => {
    const inspectionId = req.params.id;
    const timestamp = Date.now();
    const originalName = file.originalname.split('.')[0];
    
    // Determine resource type based on MIME type
    let resourceType = 'raw';
    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      resourceType = 'video'; // Cloudinary treats audio as video resource type
    } else if (file.mimetype === 'application/pdf') {
      resourceType = 'raw'; // PDFs are uploaded as raw files
    }
    
    // Add optimization parameters
    const baseParams: any = {
      folder: 'auto-inspections',
      resource_type: resourceType,
      public_id: `inspection-${inspectionId}-${originalName}-${timestamp}`,
    };
    
    // Add optimization for images
    if (file.mimetype.startsWith('image/')) {
      baseParams.transformation = [
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 1920, height: 1920, crop: 'limit' }
      ];
    }
    
    // Add optimization for videos
    // Note: Removed eager_async to avoid unhandled promise rejections
    // Videos will be transcoded on-demand instead of async
    if (file.mimetype.startsWith('video/')) {
      baseParams.quality = 'auto:good';
      // Don't use eager transformations to avoid async processing issues
    }
    
    return baseParams;
  },
});

// Create multer upload middleware with error handling
export const cloudinaryUpload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    console.log(`Upload attempt - File: ${file.originalname}, MIME type: ${file.mimetype}`);

    // Accept all image, video, audio files, and PDFs (including mobile formats)
    if (file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype.startsWith('audio/') ||
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      console.log(`Rejected file type: ${file.mimetype}`);
      cb(new Error(`File type ${file.mimetype} not allowed`) as any, false);
    }
  }
});

// Helper function to wrap multer middleware with proper error handling
export function handleMulterUpload(multerMiddleware: any) {
  return (req: any, res: any, next: any) => {
    multerMiddleware(req, res, (err: any) => {
      if (err) {
        console.error('Multer/Cloudinary upload error:', err);

        // Handle specific multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: 'File too large',
            message: 'File size exceeds 200MB limit'
          });
        }

        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            error: 'Too many files',
            message: 'Maximum 10 files allowed per upload'
          });
        }

        // Handle Cloudinary errors
        if (err.message && err.message.includes('Cloudinary')) {
          return res.status(503).json({
            error: 'Upload service error',
            message: 'Failed to upload to cloud storage. Please try again.'
          });
        }

        // Generic error
        return res.status(500).json({
          error: 'Upload failed',
          message: err.message || 'Unknown upload error occurred'
        });
      }

      next();
    });
  };
}

export { cloudinary };
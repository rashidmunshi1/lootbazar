const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {   
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex'); 
        const fileExtension = path.extname(file.originalname);
        cb(null, `${Date.now()}-${uniqueSuffix}${fileExtension}`);
    }
});

// Configure temporary storage for video uploads (Vercel-friendly)
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const fileExtension = path.extname(file.originalname);
        cb(null, `video-${Date.now()}-${uniqueSuffix}${fileExtension}`);
    }
});

// File filter for image and video formats
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image and video files are allowed.'));
    }
};

// File filter for video-only formats
const videoFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
};

const upload = multer({ storage, fileFilter });
const uploadVideo = multer({ 
    storage: videoStorage, 
    fileFilter: videoFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

module.exports = {
    upload,
    uploadVideo
};

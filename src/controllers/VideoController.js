const Status = require('../models/StatusModel');

const VideoController = {
    // Save and register metadata of a video pre-uploaded directly from the client side to Cloudinary
    upload: async (req, res) => {
        try {
            const { url, duration, publicId, size, mimetype, filename, userId, productId } = req.body;

            let videoUrl = url;
            let videoDuration = duration;
            let videoPublicId = publicId;
            let videoSize = size;
            let videoMimetype = mimetype;
            let videoFilename = filename;

            if (req.file) {
                try {
                    const cloudinary = require('../Helper/cloudinaryConfig');
                    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                        resource_type: 'video',
                        folder: 'videos'
                    });
                    videoUrl = uploadResult.secure_url;
                    videoDuration = uploadResult.duration;
                    videoPublicId = uploadResult.public_id;
                    videoSize = uploadResult.bytes;
                    videoMimetype = `${uploadResult.resource_type}/${uploadResult.format}`;
                    videoFilename = req.file.originalname;

                    // Clean up temp file
                    const fs = require('fs');
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                } catch (uploadError) {
                    console.error("Cloudinary video upload failed:", uploadError);
                    return res.status(500).json({ error: "Cloudinary video upload failed: " + uploadError.message });
                }
            }

            if (!videoUrl) {
                return res.status(400).json({ message: "Video file or Cloudinary video URL is required" });
            }
            if (!userId || !productId) {
                return res.status(400).json({ message: "userId and productId are required" });
            }

            // Create new status entry in database
            const newStatus = new Status({
                userId,
                productId,
                video: videoUrl,
                duration: videoDuration ? Number(videoDuration).toFixed(2) : null,
                publicId: videoPublicId || null,
                size: videoSize || null,
                mimetype: videoMimetype || 'video/mp4',
                filename: videoFilename || videoUrl.split('/').pop()
            });

            const savedStatus = await newStatus.save();

            res.status(200).json({
                message: "Video registered and saved successfully",
                status: savedStatus
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Fetch all video records (listing API) with populated user and product details
    index: async (req, res) => {
        try {
            const videos = await Status.find()
                .populate('userId')
                .populate('productId')
                .sort({ createdAt: -1 }); // Newest first
            res.status(200).json(videos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = VideoController;

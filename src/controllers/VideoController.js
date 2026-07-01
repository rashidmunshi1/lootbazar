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

            // Check if there is already a video for this userId and productId
            const existingStatus = await Status.findOne({ userId, productId });
            if (existingStatus) {
                // Delete existing video file from Cloudinary
                if (existingStatus.publicId) {
                    try {
                        const cloudinary = require('../Helper/cloudinaryConfig');
                        await cloudinary.uploader.destroy(existingStatus.publicId, { resource_type: 'video' });
                    } catch (cloudinaryError) {
                        console.error("Failed to delete old video from Cloudinary:", cloudinaryError);
                    }
                } else if (existingStatus.video && existingStatus.video.includes('cloudinary.com')) {
                    // Extract publicId fallback
                    const extractPublicId = (url) => {
                        try {
                            const parts = url.split('/video/upload/');
                            if (parts.length > 1) {
                                const pathAfterUpload = parts[1].replace(/^v\d+\//, '');
                                const extensionIndex = pathAfterUpload.lastIndexOf('.');
                                return extensionIndex !== -1 ? pathAfterUpload.substring(0, extensionIndex) : pathAfterUpload;
                            }
                        } catch (e) {
                            console.error(e);
                        }
                        return null;
                    };
                    const publicId = extractPublicId(existingStatus.video);
                    if (publicId) {
                        try {
                            const cloudinary = require('../Helper/cloudinaryConfig');
                            await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                        } catch (clError) {
                            console.error("Failed to delete old video from Cloudinary via fallback:", clError);
                        }
                    }
                }

                // Delete the existing status record from database
                await Status.findByIdAndDelete(existingStatus._id);
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
    // Excludes videos of expired products (older than 24 hours)
    index: async (req, res) => {
        try {
            const videos = await Status.find()
                .populate('userId')
                .populate('productId')
                .sort({ createdAt: -1 }); // Newest first

            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const activeVideos = videos.filter(video => {
                // Filter out videos if the associated product is deleted
                if (!video.productId) return false;

                // If product has no createdAt, default to active/visible
                if (!video.productId.createdAt) return true;

                // Check 24 hour limit (same as Product status virtual definition)
                const productCreatedAt = new Date(video.productId.createdAt);
                return productCreatedAt > twentyFourHoursAgo;
            });

            res.status(200).json(activeVideos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = VideoController;

const fs = require('fs');

/**
 * Extracts duration in seconds from an MP4 video file using pure JS buffer parsing.
 * Has zero dependencies and does not spawn external processes.
 * @param {string} filePath - Absolute path to the video file
 * @returns {number|null} Duration in seconds, or null if parsing fails
 */
function getMp4Duration(filePath) {
    let fd;
    try {
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;
        fd = fs.openSync(filePath, 'r');

        const chunkSize = Math.min(fileSize, 1024 * 1024); // Read up to 1MB
        const buffer = Buffer.alloc(chunkSize);

        // 1. Check the beginning of the file (for fast-start/web-optimized MP4s)
        let bytesRead = fs.readSync(fd, buffer, 0, chunkSize, 0);
        let mvhdOffset = buffer.indexOf('mvhd');

        // 2. Check the end of the file (for standard MP4s where moov is at the end)
        if (mvhdOffset === -1 && fileSize > chunkSize) {
            const position = fileSize - chunkSize;
            bytesRead = fs.readSync(fd, buffer, 0, chunkSize, position);
            mvhdOffset = buffer.indexOf('mvhd');
        }

        if (mvhdOffset === -1) {
            return null;
        }

        // Ensure we have enough bytes in the buffer to read all fields
        if (mvhdOffset + 32 > bytesRead) {
            return null;
        }

        const version = buffer.readUInt8(mvhdOffset + 4);
        
        let timescale, duration;
        if (version === 1) {
            timescale = buffer.readUInt32BE(mvhdOffset + 24);
            duration = Number(buffer.readBigUInt64BE(mvhdOffset + 28));
        } else if (version === 0) {
            timescale = buffer.readUInt32BE(mvhdOffset + 16);
            duration = buffer.readUInt32BE(mvhdOffset + 20);
        } else {
            // Unrecognized version
            return null;
        }

        if (timescale && duration) {
            const secs = duration / timescale;
            if (secs > 0 && secs < 100000) {
                return parseFloat(secs.toFixed(2));
            }
        }
        return null;
    } catch (err) {
        console.error("Failed to parse MP4 duration:", err);
        return null;
    } finally {
        if (fd !== undefined) {
            try {
                fs.closeSync(fd);
            } catch (e) {}
        }
    }
}

module.exports = { getMp4Duration };

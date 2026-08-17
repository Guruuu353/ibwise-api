const multer = require("multer");
const path = require("path");
const { ApiError } = require("../utils/apiResponse");

// Local-disk storage for development. In production, swap this for a
// multer-storage-cloudinary (or S3) engine — the rest of the app only
// ever deals with the resulting { url, filename, mimeType, size } shape,
// so nothing else needs to change (see proposal §14).
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../uploads")),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// Allow-list covers the resource types teachers actually attach to lessons
// and assignments: documents, spreadsheets, slides, images, video/audio,
// and plain archives — deliberately excludes executables/scripts.
const ALLOWED_MIME = new Set([
  // Images
  "image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv",
  // Video
  "video/mp4", "video/webm", "video/ogg", "video/quicktime",
  // Audio
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg",
  // Archives
  "application/zip", "application/x-zip-compressed",
]);

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new ApiError(400, `File type ${file.mimetype} is not allowed.`));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB — enough for short lesson videos
});

module.exports = upload;

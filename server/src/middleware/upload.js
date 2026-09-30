import multer from 'multer';
import { AppError } from '../utils/errors.js';

const MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};


/* =========================================================
   MEMORY STORAGE
========================================================= */

const storage = multer.memoryStorage();


/* =========================================================
   MULTER CREATOR
========================================================= */

const make = (maxFiles) => {
  return multer({
    storage,

    limits: {
      fileSize: 5 * 1024 * 1024,
      files: maxFiles
    },

    fileFilter: (_req, file, cb) => {
      if (MIME[file.mimetype]) {
        cb(null, true);
      } else {
        cb(
          new AppError(
            400,
            'INVALID_FILE_TYPE',
            'Please upload a JPG, JPEG, PNG, or WebP image.'
          )
        );
      }
    }
  });
};


/* =========================================================
   UPLOAD MIDDLEWARE
========================================================= */

export const uploadProfile =
  make(1).single('profileImage');

export const uploadProducts =
  make(8).array('images', 8);


/* =========================================================
   REAL IMAGE SIGNATURE CHECK
========================================================= */

const sig = (buffer) => {

  if (!buffer || buffer.length < 12) {
    return false;
  }

  /* JPEG */

  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return true;
  }

  /* PNG */

  if (
    buffer[0] === 0x89 &&
    buffer.toString('ascii', 1, 4) === 'PNG'
  ) {
    return true;
  }

  /* WEBP */

  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return true;
  }

  return false;
};


/* =========================================================
   VERIFY IMAGES
========================================================= */

export function verifyImages(files = []) {

  for (const file of files) {

    if (
      !file.buffer ||
      !Buffer.isBuffer(file.buffer)
    ) {
      throw new AppError(
        400,
        'INVALID_FILE',
        'Uploaded image data is missing.'
      );
    }

    const buffer =
      file.buffer.subarray(0, 12);

    if (!sig(buffer)) {
      throw new AppError(
        400,
        'INVALID_FILE_TYPE',
        'The uploaded file is not a valid image.'
      );
    }
  }
}


/* =========================================================
   LEGACY COMPATIBILITY
   auth.js currently imports these exports.
========================================================= */

export const removeFiles = () => {
  // Local file deletion is no longer required
  // because images are uploaded to Cloudinary.
};

export const urlFor = (_folder, file) => {
  // Kept temporarily for compatibility with
  // existing controllers.
  return file?.path || '';
};

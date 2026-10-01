import bcrypt from 'bcrypt';

import { prisma } from '../config/index.js';

import { AppError, asyncH, ok } from '../utils/errors.js';

import {
  passwordProblem,
  throwIfFields,
  validateProfileFields
} from '../utils/validators.js';

import { verifyImages } from '../middleware/upload.js';

import {
  uploadToCloudinary,
  deleteFromCloudinary
} from '../services/cloudinary.js';

import { publicUser } from './auth.js';

export const getProfile = (req, res) =>
  ok(res, {
    user: publicUser(req.user)
  });


export const updateProfile = asyncH(async (req, res) => {
  const { fields, values } = validateProfileFields(
    req.body,
    { partial: true }
  );

  throwIfFields(fields);

  if (values.dateOfBirth) {
    values.dateOfBirth = new Date(values.dateOfBirth);
  }

  const user = await prisma.user.update({
    where: {
      id: req.user.id
    },
    data: values
  });

  ok(res, {
    user: publicUser(user)
  });
});


export const changePassword = asyncH(async (req, res) => {
  const {
    currentPassword,
    newPassword,
    confirmPassword
  } = req.body;

  const fields = {};

  if (
    !(await bcrypt.compare(
      String(currentPassword || ''),
      req.user.passwordHash
    ))
  ) {
    fields.currentPassword =
      'Current password is incorrect.';
  }

  const pw = passwordProblem(newPassword);

  if (pw) {
    fields.newPassword = pw;
  }

  if (newPassword !== confirmPassword) {
    fields.confirmPassword =
      'Passwords do not match.';
  }

  throwIfFields(fields);

  await prisma.user.update({
    where: {
      id: req.user.id
    },
    data: {
      passwordHash: await bcrypt.hash(
        newPassword,
        12
      )
    }
  });

  ok(res, {
    message: 'Password updated successfully.'
  });
});


export const updateProfileImage = asyncH(async (req, res) => {

  // --------------------------------------------------
  // 1. Check image exists
  // --------------------------------------------------

  if (!req.file) {
    throw new AppError(
      422,
      'VALIDATION_ERROR',
      'Please select an image.',
      {
        profileImage:
          'Please select an image.'
      }
    );
  }


  // --------------------------------------------------
  // 2. Validate uploaded image
  // --------------------------------------------------

  verifyImages([req.file]);


  // --------------------------------------------------
  // 3. Store old profile image URL
  // --------------------------------------------------

  const oldProfileImage =
    req.user.profileImage;


  // --------------------------------------------------
  // 4. Upload new image to Cloudinary
  // --------------------------------------------------

  const uploaded =
    await uploadToCloudinary(
      req.file.buffer,
      'unique-designs/profiles'
    );


  // --------------------------------------------------
  // 5. Make sure Cloudinary returned URL
  // --------------------------------------------------

  if (
    !uploaded ||
    !uploaded.secure_url
  ) {
    throw new AppError(
      500,
      'CLOUDINARY_UPLOAD_FAILED',
      'Failed to upload profile image.'
    );
  }


  // --------------------------------------------------
  // 6. Save Cloudinary URL in database
  // --------------------------------------------------

  const user =
    await prisma.user.update({
      where: {
        id: req.user.id
      },

      data: {
        profileImage:
          uploaded.secure_url
      }
    });


  // --------------------------------------------------
  // 7. Delete old Cloudinary image
  // --------------------------------------------------

  if (
    oldProfileImage &&
    oldProfileImage.includes(
      'res.cloudinary.com'
    )
  ) {

    try {

      /*
       * Example Cloudinary URL:
       *
       * https://res.cloudinary.com/cag1w4lo/image/upload/v1234567890/unique-designs/profiles/abc123.jpg
       *
       * We need:
       *
       * unique-designs/profiles/abc123
       */

      const match =
        oldProfileImage.match(
          /\/upload\/(?:v\d+\/)?(.+)\.[^/.]+$/
        );

      if (match?.[1]) {

        await deleteFromCloudinary(
          match[1]
        );

      }

    } catch (error) {

      // Do not fail the profile update
      // just because old image cleanup failed.

      console.error(
        'Old profile image cleanup failed:',
        error?.message
      );

    }
  }


  // --------------------------------------------------
  // 8. Return updated user
  // --------------------------------------------------

  ok(res, {
    user: publicUser(user)
  });

});

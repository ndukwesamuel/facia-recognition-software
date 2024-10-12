import mongoose from "mongoose";
// import { generateToken } from "../../config/token.js";
import User from "../../models/user.model.js";
import UserProfile from "../../models/userProfile.model.js";

// import OTP from "../models/otp.model.js";
import {
  hashPassword,
  validatePassword,
} from "../../../utils/validationUtils.js";
import emailUtils from "../../../utils/emailUtils.js";
import adminProfileModel from "../../models/adminProfile.model.js";
import ApiError from "../../../utils/apiError.js";

// import { generateToken } from "../../../config/token.js";

export default {
  findUserByEmail: async function (email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw ApiError.notFound("No user with this email");
    }
    return user;
  },
  findUserProfileByIdOrEmail: async function (identifier) {
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const userProfile = await UserProfile.findOne(
      isObjectId ? { userId: identifier } : { email: identifier }
    );

    if (!userProfile) {
      throw ApiError.notFound("User Not Found");
    }

    return userProfile;
  },
  register: async function (userData = {}) {
    const { password, email, level } = userData;
    const hashedPassword = await hashPassword(password);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.create(
        [
          {
            ...userData,
            password: hashedPassword,

            isAdmin: true,
            verified: true,
          },
        ],
        { session }
      );
      const userProfile = await UserProfile.create(
        [
          {
            userId: user[0]._id,
          },
        ],
        { session }
      );

      const adminProfile = await adminProfileModel.create(
        [
          {
            userId: user[0]._id,
            level, // Admin level
          },
        ],
        { session }
      );

      const emailInfo = await emailUtils.sendOTPViaEmail(
        user[0].email,
        user[0].fullName
      );

      await session.commitTransaction();
      session.endSession();
      return {
        success: true,
        status_code: 201,
        message: `Registeration Successful, OTP has been sent to ${emailInfo.envelope.to}`,
        // data: { email: user[0].email, id: user[0], adminProfile },
        data: { adminProfile, userProfile, user },
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },
  login: async function (userData = {}) {
    const { email, password } = userData;
    const user = await this.findUserByEmail(email);
    await validatePassword(password, user.password);
    // const userProfile = await this.findUserProfileByIdOrEmail(user._id);

    // if (!userProfile.isVerified) {
    //   throw ApiError.forbidden("Email Not Verified");
    // }
    // const token = generateToken(user._id);
    return {
      success: true,
      status_code: 200,
      message: "Login Successful",
      // data: { user: { email: user.email, id: user._id }, token },
      userData: { user },
    };
  },
  // getUser: async function (userId) {
  //   const userProfile = await this.findUserProfileByIdOrEmail(userId);
  //   return {
  //     success: true,
  //     status_code: 200,
  //     message: "User Retrieved Successfully",
  //     data: {
  //       user: {
  //         id: userProfile.userId,
  //         email: userProfile.email,
  //         firstName: userProfile.firstName,
  //       },
  //     },
  //   };
  // },
  // sendOTP: async function ({ email }) {
  //   const userProfile = await this.findUserProfileByIdOrEmail(email);
  //   if (userProfile.isVerified) {
  //     return {
  //       success: true,
  //       status_code: 200,
  //       message: "User Already Verified",
  //     };
  //   }

  //   const emailInfo = await emailUtils.sendOTPViaEmail(
  //     userProfile.email,
  //     userProfile.firstName
  //   );

  //   return {
  //     success: true,
  //     status_code: 200,
  //     message: `OTP has been sent to ${emailInfo.envelope.to}`,
  //   };
  // },
  // verifyOTP: async function ({ email, otp }) {
  //   const userProfile = await this.findUserProfileByIdOrEmail(email);
  //   if (userProfile.isVerified) {
  //     return {
  //       success: true,
  //       status_code: 200,
  //       message: "User Already Verified",
  //     };
  //   }
  //   const otpExists = await OTP.findOne({ email, otp });
  //   if (!otpExists) {
  //     throw ApiError.badRequest("Invalid or Expired OTP");
  //   }
  //   userProfile.isVerified = true;
  //   await userProfile.save();
  //   return {
  //     success: true,
  //     status_code: 200,
  //     message: "Email Verified",
  //   };
  // },
  // forgotPassword: async function ({ email }) {
  //   const userProfile = await this.findUserProfileByIdOrEmail(email);
  //   const emailInfo = await emailUtils.sendOTPViaEmail(
  //     userProfile.email,
  //     userProfile.firstName
  //   );
  //   return {
  //     success: true,
  //     status_code: 200,
  //     message: `OTP has been sent to ${emailInfo.envelope.to}`,
  //   };
  // },
  // resetPassword: async function ({ email, otp, password }) {
  //   const user = await this.findUserByEmail(email);
  //   const otpExists = await OTP.findOne({ email, otp });
  //   if (!otpExists) {
  //     throw ApiError.badRequest("Invalid or Expired OTP");
  //   }
  //   user.password = password;
  //   await user.save();
  //   return {
  //     success: true,
  //     status_code: 200,
  //     message: "Password Updated",
  //   };
  // },
};

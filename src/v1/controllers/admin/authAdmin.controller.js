import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import authAdminService from "../../services/Admin/auth.service.js";
// import authService from "../../v1/services/Admin/authAdmin.service.js";

authAdminService;

export const adminregister = asyncWrapper(async (req, res, next) => {
  const userData = req.body;
  const result = await authAdminService.register(userData);
  res.status(201).json(result);
});

export const adminlogin = asyncWrapper(async (req, res, next) => {
  const userData = req.body;
  const result = await authAdminService.login(userData);
  res.status(200).json(result);
});

// export const getUser = asyncWrapper(async (req, res, next) => {
//   const { userId } = req.user;
//   const result = await authService.getUser(userId);
//   res.status(200).json(result);
// });

// export const sendOTP = asyncWrapper(async (req, res, next) => {
//   const { email } = req.body;
//   const result = await authService.sendOTP({ email });
//   res.status(200).json(result);
// });

// export const verifyOTP = asyncWrapper(async (req, res, next) => {
//   const { email, otp } = req.body;
//   const result = await authService.verifyOTP({ email, otp });
//   res.status(200).json(result);
// });

// export const forgotPassword = asyncWrapper(async (req, res, next) => {
//   const { email } = req.body;
//   const result = await authService.forgotPassword({ email });
//   res.status(200).json(result);
// });

// export const resetPassword = asyncWrapper(async (req, res, next) => {
//   const { email, otp, password } = req.body;
//   const result = await authService.resetPassword({ email, otp, password });
//   res.status(200).json(result);
// });

export default { adminregister, adminlogin };

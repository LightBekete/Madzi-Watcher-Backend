import WaterMonitor from "../models/WaterMonitors.mjs"
import Employee from "../models/Employee.mjs"
import Otp from "../models/Otp.mjs"
import sendEmail from "../utils/sendEmail.mjs"
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt.mjs"
import {
  generateRandomCode,
  hashPassword,
  comparePassword,
  maskEmail,
} from "../utils/helpers.mjs"
import IdentityVerificationSession from "../models/IdentityVerificationSession.mjs"
import RefreshToken from "../models/RefreshToken.mjs"
import mongoose from "mongoose"

// Verify OTP
export const verifyOtp = async (req, res, next) => {
  try {
    const {loginSessionId, otp} = req.body

    if(!mongoose.Types.ObjectId.isValid(loginSessionId)) {
      return res.status(400).json({status: "failed:", message: "Invalid login session "})
    }
    //verifying if the session  for otp exists and is pending
    const session = await otp.findById(loginSessionId).populate("watermonitor")
    if (!session || session.status !== "Pending") {
      return res.status(400).json({status: "failed:", message: "Invalid or expired OTP"})
    }
    //checking if the otp matches the one in the session and if it is not expired
    if(session.expiresAt < new Date()) {
      session.status = "Expired"
      await session.save()
      return res.status(400).json({status: "failed:", message: "OTP has expired"})
    }
    if(session.code !== otp){
      return res.status(400).json({status: "failed:", message: "Invalid OTP"})
    }

    session.status = "Used"
    await session.save()

    const accessToken = generateAccessToken(session.watermonitor)
    const refreshToken = generateRefreshToken(session.watermonitor)
    const decoded = verifyRefreshToken(refreshToken)

  } catch (error) {
    next(error);
    
  }
  
}


// Register User
export const registerUser = async (req, res, next) => {
  try {
    
    
  } catch (error) {
    next(error);
    
  }
  
}

// Login User
export const loginUser = async (req, res, next) => {
  try {
    
    
  } catch (error) {
    next(error);
    
  }
  
};


// Logout User
export const logoutUser = async (req, res, next) => {
  try {
    
    
  } catch (error) {
    next(error);
    
  }
  
}


// Refresh Token
export const refreshToken = async (req, res, next) => {
  try {
    
    
  } catch (error) {
    next(error);
    
  }
  
}

// Request Password Reset
export const requestPasswordReset = async (req, res, next) => {
  try {
    
    
  } catch (error) {
    next(error);
    
  }
  
}

//reset password
export const resetPassword = async (req, res, next) => {
  try {
    
    
  } catch (error) {
    next(error);
    
  }
  
}

//change password
export const changePassword = async (req, res, next) => {
  try {
    
    
  } catch (error) {
    next(error);
    
  }

}


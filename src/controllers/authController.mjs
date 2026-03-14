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
import WaterMonitors from "../models/WaterMonitors.mjs"
//import { AccessTokenInstance } from "twilio/lib/rest/verify/v2/service/accessToken"

// Verify OTP
export const verifyOtp = async (req, res, next) => {
  try {
    const {email, otp} = req.body
    console.log("Received OTP verification request:", {email, otp});
    //verifying if the session  for otp exists and is pending
    const session = await Otp.findOne({email})
    console.log("Found OTP session:", session);

    if (session.code !== otp) {
      session.status = "expired"
      await session.save()
      return res.status(400).json({status: "failed:", message: "OTP has expired"})
    }
    //veriffication session for otp
    session.status = "verified"
    await session.save()

    const verificationSession = await IdentityVerificationSession.findOne({email: email}) //status: "pending"

    if(!verificationSession) {
      return res.status(400).json({status: "failed:", message: "No pending verification session found"})
    }

    verificationSession.status = "verified"
    await verificationSession.save()

    //used granted permission to login
    res.status(200).json({
      status: "success",
      message: "OTP verified successfully. You can now log in."

    })

  } catch (error) {
    next(error);
    
  }
  
}

// Register User
export const registerUser = async (req, res, next) => {
  try {
    const {email, role,location, verificationSessionId} = req.validatedData

    const verificationSession = await IdentityVerificationSession.findById(verificationSessionId)

    if(!verificationSession || verificationSession.status !== "verified") {
      return res.status(400).json({status: "failed:", message: "Expired verification session"})
    }
    //checking if the email is already in use
    const existingUser = await WaterMonitors.findOne({email})
    if(existingUser) {
      return res.status(400).json({status: "failed:", message: "WaiterMonitor already registered"})
    } 
    //checking first if the employee to be registered as Watermonitor exists
    const employee = await Employee.findOne({email})

    if(!employee) {
      return res.status(400).json({status: "failed:", message: "No employee found with the provided email"})
    }

    
    //registering new water monitor
    const waterMonitor = await WaterMonitor.create({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      user: employee._id,
      phoneNumber: employee.phoneNumber,
      role: role || "WaterMonitor",
      location: {
        assignedArea: location.assignedArea,
        district: location.district,
      }
      
    })
    
    //sending email notification to the new water monitor
    const html = `
      <h1>Madzi Watcher Alert</h1>
      <p>Dear ${employee.firstName} ${employee.lastName},</p>
      <p>You have been registered as a Water Monitor. Your account has been created successfully.</p>

      <h3>Account Details:</h3>
      <ul>
        <li><strong>Email:</strong> ${employee.email}</li>
        
      </ul>
      <p>Thank you for joining the Madzi Watcher team!</p>
    `
    await sendEmail(employee.email, "Welcome to Madzi Watcher - Your Account Details", html)

    res.status(201).json({
      status: "success",
      message: "Water monitor registered successfully",
      data: {
        waterMonitor,
      }
    })
    //generating otp for first login
    // const otpCode = generateRandomCode(6)
    // const otp = await Otp.create({
    //   user: waterMonitor._id,
    //   code: otpCode,  
    //   expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    //   status: "Registration",
    // })

    
    res.status(20).json({
      status: "success",
      message: "Water monitor registered successfully",
      data: {
        waterMonitor,
      }
    })
  
  } catch (error) {
    next(error);
    
  }
  
}

// Login User
export const loginUser = async (req, res, next) => {
  try {
      const{email, password} = req.validatedData
      console.log("Login request received:", { email });

    const findWaterMonitor = await WaterMonitors.findOne({email})
    if(!findWaterMonitor) {
      return res.status(400).json({status: "failed:", message: "Invalid email or password"})
    }
    
    const isPasswordValid = await comparePassword(password, findWaterMonitor.password)
    if(!isPasswordValid) {
      return res.status(400).json({status: "failed:", message: "Invalid email or password"})
    }
    const payload ={
      sub: findWaterMonitor._id,
      role:findWaterMonitor.role
    }

    //generating refresh token and access token for the waterMonitor
    console.log("Generating tokens with payload",payload);
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload) 
    const decoded = verifyRefreshToken(refreshToken)

    await RefreshToken.create({
      token: refreshToken,
      user: findWaterMonitor._id,
      expiresAt: decoded.exp,
      revoked: false, 
    })

    const otpCode = generateRandomCode()

    const otp = await Otp.findOneAndUpdate(
      {
        email: findWaterMonitor.email,
      },
      {
        $set:{
          code: otpCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) //session expires in 10 minutes
        }
      },
      {
        new: true, //return updated document
        upsert: true //create one if not found
      }
    )

    const html = `
      <h1>Madzi Watcher Alert</h1>
      <p>Your login veriification code is: ${otpCode}</p>
      <p>This code will expire in 10 minutes.</p>'
    `
    const result = await sendEmail(findWaterMonitor.email, "Madzi Watcher Login OTP", html)

    const sessionExpires = new Date(Date.now() + 10 * 60 * 1000) // session expires in 15 minutes

    const session = await IdentityVerificationSession.findOneAndUpdate(
      {
        email: findWaterMonitor.email
      },
      {
        $set:{
          waterMonitorId: findWaterMonitor._id,
          status: "pending",
          expiresAt:sessionExpires
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    // res.cookie("refreshLoginToken ", refreshToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "none",
      
    // })

    res.status(200).json({
      status: "success",
      message:{
        accessTokenInstance: accessToken,
        refreshTokenInstance: refreshToken,
        otpCode: otpCode,
        sessionId: session._id,
        user:{
          id: findWaterMonitor._id,
          email: findWaterMonitor.email,
        } 
      
      }
    })
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
    const {email} = req.validatedData
    const findWaterMonitor = await WaterMonitors.findOne({email})
    if(!findWaterMonitor) {
      return res.status(400).json({status: "failed:", message: "Email not found"})
    }
    //generating otp for password reset
   const otpCode = generateRandomCode()
   const otp = await Otp.findOneAndUpdate(
    {
      email: findWaterMonitor.email,
    },
    {
      $set:{
        code: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), //session expires in 10 minutes
        status: "pending"
      }
    }, 
    {
      new: true, //return updated document
      upsert: true //create one if not found
    }
    
   );
   const sessionExpires = new Date(Date.now() + 15 * 60 * 1000) // session expires in 15 minutes

   const session = await IdentityVerificationSession.findOneAndUpdate(  
    {
      waterMonitorId: findWaterMonitor._id
    },
    {
      $set:{
        email: findWaterMonitor.email,
        status: "pending",
        expiresAt: sessionExpires 
      }
    },
    {
      new: true,
      upsert: true
    }
   
  );


   const html = `
      <h1>Madzi Watcher Alert</h1>
      <p>Your password reset code is: ${otpCode}</p>
      <p>This code will expire in 10 minutes.</p>'
    `
    await sendEmail(findWaterMonitor.email, "Madzi Watcher Password Reset OTP", html)

    return res.status(200).json({
      status: "success",
      message: `Password reset OTP sent to ${email}`
    });
    
  } catch (error) {
    next(error);
    
  }
  
}

//reset password
export const resetPassword = async (req, res, next) => {
  try { 
    const {email, newPassword, confirmNewPassword} = req.validatedData  

    if(newPassword !== confirmNewPassword) {
      return res.status(400).json({status: "failed:", message: "Passwords do not match"})
    }
    
    const findWaterMonitor = await WaterMonitors.findOne({email})
    if(!findWaterMonitor) {
      return res.status(400).json({status: "failed:", message: "Email not found"})
    }

    //checking  otpsession using email
    const otpSession = await Otp.findOne({email})
  
    if(otpSession && otpSession.status !== "verified") { 
      return res.status(400).json({status: "failed:", message: "OTP session not verified for the email"})
    }
  
    const hashedPassword = await hashPassword(newPassword)
    findWaterMonitor.password = hashedPassword
    await findWaterMonitor.save()
    
  
    res.status(200).json({
      status: "success",
      message: "Password reset successful. You can now log in with your new password."
    })

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


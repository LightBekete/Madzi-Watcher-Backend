import WaterMonitor from "../models/WaterMonitors.mjs"
import mongoose from "mongoose"


//logic to get all users
export const getAllUsers = async (req,res,next)=> {
    try {

      const getWaterMonitors = await WaterMonitor.find({});

  if (getWaterMonitors.length === 0) {
    return res.status(404).json({
      status: "failed",
      message: "No water monitors found"
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Users returned successfully",
    data: getWaterMonitors
  });

    
    
  } catch (error) {
    next(error);
    
  }
    
   
}
//logic to get users by id
export const getUserById = async (req,res, next)=> {
    try {
      const { id } = req.params;

    // check if id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid user ID"
      });
    }

    // query database
    const user = await WaterMonitor.findById(id);

    // check if document exists
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User retrieved successfully",
      data: user
    });
    
    
  } catch (error) {
    next(error);
    
  }
   
}
//logic to get profile
export const getMyProfile = async (req,res,next)=> {
    try {

      const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "failed",
        message: "Unauthorized. User not identified."
      });
    }

    const user = await WaterMonitor.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User profile not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Profile retrieved successfully",
      data: user
    });
    
  } catch (error) {
    next(error);
    
  }
    
    
}
//logic to update user profile
export const updateUserProfile = async (req,res, next)=> {
    try {
    
    
  } catch (error) {
    next(error);
    
  }
  
}
//logic to update User
export const deleteUser = async (req,res)=> {
    try {
    
    
  } catch (error) {
    next(error);
    
  }
    
   
}

//promote user
export const promoteUser = async (req, res, next) => {
    try {
    
    
  } catch (error) {
    next(error);
    
  }
  
}



  
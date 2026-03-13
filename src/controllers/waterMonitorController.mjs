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
       const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "failed",
        message: "Unauthorized. User not identified."
      });
    }

    const updateData = req.body;

    const updatedUser = await WaterMonitor.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,          // return updated document
        runValidators: true // enforce schema validation
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        status: "failed",
        message: "User not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: updatedUser
    });
    
    
  } catch (error) {
    next(error);
    
  }
  
}
//logic to update User
export const deleteUser = async (req,res)=> {
    try {
      const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid user ID"
      });
    }

    // Delete user
    const deletedUser = await WaterMonitor.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        status: "failed",
        message: "User not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User deleted successfully",
      data: {
        id: deletedUser._id,
        email: deletedUser.email
      }
    });

    
    
  } catch (error) {
    next(error);
    
  }
    
   
}

//promote user
export const promoteUser = async (req, res, next) => {
    try {
    const { id } = req.params;
    const { newRole } = req.body; // e.g., "admin" or "superadmin"

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid user ID"
      });
    }

    // Validate role input
    const allowedRoles = ["officer", "admin", "superadmin"];
    if (!newRole || !allowedRoles.includes(newRole)) {
      return res.status(400).json({
        status: "failed",
        message: `Invalid role. Allowed roles: ${allowedRoles.join(", ")}`
      });
    }

    // Find user
    const user = await WaterMonitor.findById(id);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found"
      });
    }

    // Prevent promoting oneself (optional)
    if (req.user.id === user._id.toString()) {
      return res.status(403).json({
        status: "failed",
        message: "You cannot change your own role"
      });
    }

    // Update role
    user.role = newRole;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "User promoted successfully",
      data: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    next(error);
    
  }
  
}



  
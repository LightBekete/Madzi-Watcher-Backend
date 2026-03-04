import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const WaterMonitorSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        index: true,
    },
    lastName: {
        type: String,
        required: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    user: {
        type: Types.ObjectId,
        ref: "Employee",
        required: true,
    },
    password: {
        type: String,
        required: true,
    },          
    role: {
        type: String,
        default: null,
    },
    phoneNumber: {
        type: String,
        default: null,
    },
     location: {
      assignedArea: {
        type: String,
        default: null,
      },
      district: {
        type: String,
        default: null,
      }
     }  
});

export default model("WaterMonitor", WaterMonitorSchema);

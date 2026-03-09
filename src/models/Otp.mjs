import  Mongoose  from "mongoose"; 
const { Schema } = Mongoose;

const OtpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,       
        index: true,                
    },
    status: {
      type: String, 
      required: true,
      enum: ["pending", "verified"], 
      default: "pending" 
    },
    code: {
      type: String,             
        required: true,         
        index: true,    
    },
    expiresAt: {
      type: Date,                                                                               
        required: true,             
        index: { expires: 0 } // TTL index to auto-delete expired OTPs                  
    }                       
    },
    {           
        timestamps: true, // Automatically add createdAt and updatedAt fields
    }                                                               
);  
OtpSchema.index({ email: 1, code: 1 }, { unique: true }); // Ensure unique OTP per email                                                  

export default Mongoose.model("Otp", OtpSchema);    
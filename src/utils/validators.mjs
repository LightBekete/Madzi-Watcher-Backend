import Joi from 'joi';

// USER VALIDATION
export const registerWaterMonitorSchema = Joi.object({
  email: Joi.string().email().required(), 
  role: Joi.string().valid('water_monitor').required(),
  location: Joi.object({
     assignedArea: Joi.string().required(),
     district: Joi.string().required(),
  }).required(),
  verificationSessionId: Joi.string().required(),

});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().required(),
  confirmNewPassword: Joi.string().required()
});

//EMAIL VALIDATION
export const validateEmail = Joi.object({
  email: Joi.string().email()
    
})
//VALIDATE PASSWORD
export const validatePassword = Joi.object({
  password: Joi.string().required(),
  confirmPasword:Joi.string().required()


})
//VALIDATE CHANGE PASSWORD
export const validateChangePassword = Joi.object({
  userId: Joi.string(),
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().required(),
  confirmNewPassword: Joi.string().required()
 
})
//LOG IN VALIDATION
export const loginValidation = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required()
  
})


// NOTIFICATION VALIDATION
export const notificationSchema = Joi.object({
  user: Joi.string().email().required(),
  type: Joi.string().valid("info", "error", "success"),
  title: Joi.string().required(),
  read: Joi.boolean(),
  link: Joi.string(),
  message: Joi.string().min(5).max(500).required(),
  createdAt: Joi.date().required()
  
});

//VALIDATE THE UPLOADS
export const uploadValidationSchema = Joi.object({
  type: Joi.string().valid('id_card', 'license', 'degree', 'certificate', 'other').required()
})

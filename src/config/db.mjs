import mongoose from "mongoose"
import dotenv from "dotenv"
import WaterMonitor from "../models/WaterMonitors.mjs"
import { hashPassword } from "../utils/helpers.mjs"
import Employee from "../models/Employee.mjs"

dotenv.config()

const MONGO_URL_CLASTER = process.env.MONGO_URL_CLASTER
const MONGO_URI_CAMPUSS = process.env.MONGO_URI_CAMPUSS

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URL_CLASTER || MONGO_URI_CAMPUSS)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
    await createSuperUser()
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB

export const createSuperUser = async () => {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD

  try {
    const existingSuperAdmin = await WaterMonitor.findOne({ role: "superadmin" })
    if (existingSuperAdmin) {
      console.log("Super admin already exists")
      return
    }

    const employee = await Employee.findOne({ email: superAdminEmail })
    if (!employee) {
      throw new Error("Super admin employee not found in Employee database")
    }

    const existingUser = await WaterMonitor.findOne({ email: employee.email })

    if (existingUser) {
      existingUser.role = "superadmin"
      await existingUser.save()
      console.log("Existing user promoted to superadmin")
      return
    }

    const hashedPassword = await hashPassword(superAdminPassword)

    const superAdmin = await WaterMonitor.create({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: superAdminEmail,
      user: employee._id,
      password: hashedPassword,
      role: "superadmin",
      location: {
        assignedArea: "Headquarters",
        district: "Central District"
      } 
    })

    console.log("Super admin account created:", superAdmin.email)
  } catch (error) {
    console.error("Failed to create super admin:", error.message)
  }
}

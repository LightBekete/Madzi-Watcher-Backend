import mongoose from "mongoose"
import { hashPassword } from "../utils/helpers.mjs"

const { Schema, model } = mongoose

const waterQualitySchema = new Schema({
  pH: { type: Number, required: true },
  tds: { type: Number, required: true },
  electricalConductivity: { type: Number, required: true },
  turbidity: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }, 
})

export default model("WaterQualityData", waterQualitySchema)

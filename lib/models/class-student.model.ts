import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IClassStudent extends Document {
  id: string
  name: string
  section: string
  enrolled: boolean
}

const ClassStudentSchema = new Schema<IClassStudent>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    section: String,
    enrolled: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const ClassStudentModel =
  (mongoose.models.ClassStudent as Model<IClassStudent> | undefined) ??
  mongoose.model<IClassStudent>("ClassStudent", ClassStudentSchema)

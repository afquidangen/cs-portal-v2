import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ISchedule extends Document {
  id: string
  day: string
  time: string
  subject: string
  room: string
  instructor: string
  section: string
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    id: { type: String, required: true, unique: true },
    day: String,
    time: String,
    subject: String,
    room: String,
    instructor: String,
    section: String,
  },
  { timestamps: true }
)

export const ScheduleModel =
  (mongoose.models.Schedule as Model<ISchedule> | undefined) ??
  mongoose.model<ISchedule>("Schedule", ScheduleSchema)

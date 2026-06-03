import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ISchedule extends Document {
  id: string
  semesterId: string
  day: string
  time: string
  subject: string
  room: string
  instructor: string
  section: string
}

if (mongoose.models.Schedule) {
  delete mongoose.models.Schedule
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    id: { type: String, required: true, unique: true },
    semesterId: { type: String, required: true },
    day: String,
    time: String,
    subject: String,
    room: String,
    instructor: String,
    section: String,
  },
  { timestamps: true }
)

export const ScheduleModel: Model<ISchedule> = mongoose.model<ISchedule>("Schedule", ScheduleSchema)

import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IFeedback extends Document {
  id: string
  studentId?: string
  studentName: string
  category: string
  subject: string
  description: string
  status: "Pending" | "In Progress" | "Resolved"
  submittedAt: string
  assignedTo: string
  resolution?: string
  anonymous: boolean
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    id: { type: String, required: true, unique: true },
    studentId: String,
    studentName: { type: String, required: true },
    category: String,
    subject: String,
    description: String,
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
    submittedAt: String,
    assignedTo: { type: String, default: "" },
    resolution: String,
    anonymous: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const FeedbackModel =
  (mongoose.models.Feedback as Model<IFeedback> | undefined) ??
  mongoose.model<IFeedback>("Feedback", FeedbackSchema)

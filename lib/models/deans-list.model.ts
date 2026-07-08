import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IDeansListEntry extends Document {
  id: string
  studentId: string
  studentName: string
  semesterId: string
  semester: string
  schoolYearStart: number
  schoolYearEnd: number
  gwa: number | null
  totalUnits: number
  yearLevel: string
  isQualified: boolean
  disqualificationReasons: string[]
  manualOverride: "none" | "include" | "exclude"
  rank: number | null
  published: boolean
  publishedAt: string | null
  needsRecalculation: boolean
  createdAt?: string
  updatedAt?: string
}

if (mongoose.models.DeansListEntry) {
  delete mongoose.models.DeansListEntry
}

const DeansListEntrySchema = new Schema<IDeansListEntry>(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    semesterId: { type: String, required: true },
    semester: { type: String, required: true },
    schoolYearStart: { type: Number, required: true },
    schoolYearEnd: { type: Number, required: true },
    gwa: { type: Number, default: null },
    totalUnits: { type: Number, default: 0 },
    yearLevel: { type: String, required: true, default: "" },
    isQualified: { type: Boolean, default: false },
    disqualificationReasons: { type: [String], default: [] },
    manualOverride: {
      type: String,
      enum: ["none", "include", "exclude"],
      default: "none",
    },
    rank: { type: Number, default: null },
    published: { type: Boolean, default: false },
    publishedAt: { type: String, default: null },
    needsRecalculation: { type: Boolean, default: false },
  },
  { timestamps: true }
)

DeansListEntrySchema.index({ semesterId: 1, studentId: 1 }, { unique: true })
DeansListEntrySchema.index({ semesterId: 1, rank: 1 })
DeansListEntrySchema.index({ semesterId: 1, yearLevel: 1, rank: 1 })

export const DeansListModel: Model<IDeansListEntry> = mongoose.model<IDeansListEntry>("DeansListEntry", DeansListEntrySchema)

import mongoose, { Schema, type Document, type Model } from "mongoose"

export type GradeWorkflowStatus = "Draft" | "Submitted" | "Reviewed" | "Approved" | "Locked"

export interface ICategoryGrade {
  category: string
  totalStudentScore: number
  totalPossibleScore: number
  percentageScore: number
  weightedScore: number
  grade: number
}

export type ReleaseHistoryEntry = {
  action: "released" | "unreleased" | "re-released"
  reason?: string
  timestamp: string
}

export interface IGrade extends Document {
  id: string
  studentId: string
  student: string
  section: string
  subject: string
  code: string
  units: number
  classId: string
  subjectType: "Lecture" | "Lecture with Lab"

  scores: Map<string, number>
  maxScores: Map<string, number>

  categoryGrades: ICategoryGrade[]
  lectureClassStanding?: number
  lectureExam?: number
  lectureGrade?: number
  laboratoryGrade?: number

  midtermClassStanding?: number
  midtermExam?: number
  midtermLaboratoryGrade?: number
  midtermGrade?: number

  finalClassStanding?: number
  finalExam?: number
  finalLaboratoryGrade?: number
  tentativeFinalGrade?: number

  finalGrade?: number
  transmutedGrade?: number
  remarks?: string
  midtermRemarks?: string
  finalRemarks?: string

  midtermTransmuted?: number
  midterm?: number
  finalTransmuted?: number
  finalTerm?: number
  gradePercentage?: number

  midtermReleased?: boolean
  finalReleased?: boolean
  midtermReleaseHistory?: ReleaseHistoryEntry[]
  finalReleaseHistory?: ReleaseHistoryEntry[]
  workflowStatus: GradeWorkflowStatus
  released: boolean
  gradingSchemeId?: string
  semesterId?: string

  releasedMidtermGrade?: number
  releasedMidtermTransmuted?: number
  releasedMidtermRemarks?: string
  releasedTentativeFinalGrade?: number
  releasedFinalTransmuted?: number
  releasedFinalRemarks?: string
  releasedFinalGrade?: number
  releasedTransmutedGrade?: number
  releasedRemarks?: string

  updatedAt: string
  deletedAt?: string | null
}

const CategoryGradeSchema = new Schema<ICategoryGrade>(
  {
    category: { type: String, required: true },
    totalStudentScore: { type: Number, default: 0 },
    totalPossibleScore: { type: Number, default: 0 },
    percentageScore: { type: Number, default: 0 },
    weightedScore: { type: Number, default: 0 },
    grade: { type: Number, default: 0 },
  },
  { _id: false }
)

const GradeSchema = new Schema<IGrade>(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    student: String,
    section: String,
    subject: String,
    code: String,
    units: { type: Number, default: 3 },
    classId: { type: String, default: "" },
    subjectType: {
      type: String,
      enum: ["Lecture", "Lecture with Lab"],
      default: "Lecture",
    },

    scores: { type: Map, of: Number, default: new Map() },
    maxScores: { type: Map, of: Number, default: new Map() },

    categoryGrades: { type: [CategoryGradeSchema], default: [] },
    lectureClassStanding: Number,
    lectureExam: Number,
    lectureGrade: Number,
    laboratoryGrade: Number,

    midtermClassStanding: Number,
    midtermExam: Number,
    midtermLaboratoryGrade: Number,
    midtermGrade: Number,

    finalClassStanding: Number,
    finalExam: Number,
    finalLaboratoryGrade: Number,
    tentativeFinalGrade: Number,

    finalGrade: Number,
    transmutedGrade: Number,
    remarks: String,
    midtermRemarks: String,
    finalRemarks: String,

    midtermTransmuted: Number,
    midterm: Number,
    finalTransmuted: Number,
    finalTerm: Number,
    gradePercentage: Number,

    midtermReleased: { type: Boolean, default: false },
    finalReleased: { type: Boolean, default: false },
    midtermReleaseHistory: { type: [{ action: String, reason: String, timestamp: String }], default: [] },
    finalReleaseHistory: { type: [{ action: String, reason: String, timestamp: String }], default: [] },
    workflowStatus: {
      type: String,
      enum: ["Draft", "Submitted", "Reviewed", "Approved", "Locked"],
      default: "Draft",
    },
    released: { type: Boolean, default: false },
    gradingSchemeId: String,
    semesterId: { type: String },

    releasedMidtermGrade: Number,
    releasedMidtermTransmuted: Number,
    releasedMidtermRemarks: String,
    releasedTentativeFinalGrade: Number,
    releasedFinalTransmuted: Number,
    releasedFinalRemarks: String,
    releasedFinalGrade: Number,
    releasedTransmutedGrade: Number,
    releasedRemarks: String,

    updatedAt: String,
    deletedAt: { type: String, default: null },
  },
  { timestamps: true }
)

GradeSchema.index({ classId: 1, studentId: 1 })
GradeSchema.index({ studentId: 1 })
GradeSchema.index({ studentId: 1, code: 1, semesterId: 1 }, { unique: true })

export const GradeModel =
  (mongoose.models.Grade as Model<IGrade> | undefined) ??
  mongoose.model<IGrade>("Grade", GradeSchema)

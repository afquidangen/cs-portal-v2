import mongoose, { Schema, type Document, type Model } from "mongoose"

export type GradeWorkflowStatus = "Draft" | "Submitted" | "Reviewed" | "Approved" | "Locked"

export interface ICategoryGrade {
  category: string
  totalStudentScore: number
  totalPossibleScore: number
  grade: number
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

  categoryGrades: ICategoryGrade[]
  lectureClassStanding?: number
  lectureExam?: number
  lectureGrade?: number
  laboratoryGrade?: number
  midtermGrade?: number
  tentativeFinalGrade?: number
  finalGrade?: number
  transmutedGrade?: number
  remarks?: string

  workflowStatus: GradeWorkflowStatus
  released: boolean
  gradingSchemeId?: string

  updatedAt: string
  deletedAt?: string | null
}

const CategoryGradeSchema = new Schema<ICategoryGrade>(
  {
    category: { type: String, required: true },
    totalStudentScore: { type: Number, default: 0 },
    totalPossibleScore: { type: Number, default: 0 },
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

    categoryGrades: { type: [CategoryGradeSchema], default: [] },
    lectureClassStanding: Number,
    lectureExam: Number,
    lectureGrade: Number,
    laboratoryGrade: Number,
    midtermGrade: Number,
    tentativeFinalGrade: Number,
    finalGrade: Number,
    transmutedGrade: Number,
    remarks: String,

    workflowStatus: {
      type: String,
      enum: ["Draft", "Submitted", "Reviewed", "Approved", "Locked"],
      default: "Draft",
    },
    released: { type: Boolean, default: false },
    gradingSchemeId: String,

    updatedAt: String,
    deletedAt: { type: String, default: null },
  },
  { timestamps: true }
)

GradeSchema.index({ classId: 1, studentId: 1 })
GradeSchema.index({ studentId: 1 })

export const GradeModel =
  (mongoose.models.Grade as Model<IGrade> | undefined) ??
  mongoose.model<IGrade>("Grade", GradeSchema)

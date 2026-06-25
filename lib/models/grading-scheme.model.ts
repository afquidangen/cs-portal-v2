import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IGradingCategory {
  name: string
  weight: number
  isAttendance?: boolean
  penaltyPerAbsence?: number
}

export interface ISchemeComponent {
  name: string
  weight: number
  categories: IGradingCategory[]
  isExam?: boolean
}

export interface IGradingScheme extends Document {
  id: string
  name: string
  subjectType: "Lecture" | "Lecture with Lab"
  isDefault: boolean
  isActive: boolean
  components: ISchemeComponent[]
  labComponents?: ISchemeComponent[]
  lectureWeight?: number
  laboratoryWeight?: number
  createdAt: string
  updatedAt: string
}

const GradingCategorySchema = new Schema<IGradingCategory>(
  {
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    isAttendance: { type: Boolean },
    penaltyPerAbsence: { type: Number },
  },
  { _id: false }
)

const SchemeComponentSchema = new Schema<ISchemeComponent>(
  {
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    categories: { type: [GradingCategorySchema], default: [] },
    isExam: { type: Boolean },
  },
  { _id: false }
)

const GradingSchemeSchema = new Schema<IGradingScheme>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subjectType: {
      type: String,
      enum: ["Lecture", "Lecture with Lab"],
      required: true,
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    components: { type: [SchemeComponentSchema], default: [] },
    labComponents: { type: [SchemeComponentSchema], default: [] },
    lectureWeight: { type: Number },
    laboratoryWeight: { type: Number },
  },
  { timestamps: true }
)

export const GradingSchemeModel =
  (mongoose.models.GradingScheme as Model<IGradingScheme> | undefined) ??
  mongoose.model<IGradingScheme>("GradingScheme", GradingSchemeSchema)

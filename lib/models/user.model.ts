import bcrypt from "bcryptjs"
import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IUser extends Document {
  id: string
  name: string
  email: string
  password: string
  role: "student" | "faculty" | "admin"
  roles?: string[]
  firstName?: string
  middleName?: string
  lastName?: string
  contactNumber?: string
  sex?: string
  birthday?: string
  address?: string
  photoUrl?: string
  cloudinaryPublicId?: string
  studentType?: string
  curriculum?: string
  curriculumId?: string
  currentYearLevel?: string
  currentSemester?: string
    gradeHistory?: {
      subjectCode: string
      subjectName: string
      finalPercentile: number
      transmutedGrade: number
      remarks: string
      curriculumId: string
      yearLevel: string
      semester: string
      units?: number
    }[]
  semesterGwas?: Array<{
    semesterId: string
    semester: string
    schoolYearStart: number
    schoolYearEnd: number
    gwa: number | null
  }>
  advisoryClass?: string
  employmentType?: string
  academicTitle?: string
  course?: string
  year?: number
  section?: string
  position?: string
  status: "Active" | "Inactive"
  createdAt?: string
  lastLogin?: string
  deletedAt?: string | null
  comparePassword(candidate: string): Promise<boolean>
}

if (mongoose.models.User) {
  delete mongoose.models.User
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      required: true,
    },
    firstName: String,
    middleName: String,
    lastName: String,
    contactNumber: String,
    sex: String,
    birthday: String,
    address: String,
    photoUrl: String,
    cloudinaryPublicId: String,
    studentType: String,
    curriculum: String,
    curriculumId: String,
    currentYearLevel: String,
    currentSemester: String,
    gradeHistory: [
      {
        subjectCode: String,
        subjectName: String,
        finalPercentile: Number,
        transmutedGrade: Number,
        remarks: String,
        curriculumId: String,
        yearLevel: String,
        semester: String,
        section: String,
        units: Number,
        editReason: String,
        editedBy: String,
        editedAt: String,
      },
    ],
    semesterGwas: [
      {
        semesterId: String,
        semester: String,
        schoolYearStart: Number,
        schoolYearEnd: Number,
        gwa: { type: Number, default: null },
      },
    ],
    advisoryClass: String,
    employmentType: String,
    academicTitle: String,
    course: String,
    year: Number,
    section: String,
    position: String,
    roles: { type: [String], default: [] },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    createdAt: String,
    lastLogin: String,
    deletedAt: { type: String, default: null },
  },
  { timestamps: true }
)

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password)
}

export const UserModel: Model<IUser> = mongoose.model<IUser>("User", UserSchema)

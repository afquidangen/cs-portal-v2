import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IUser extends Document {
  id: string
  name: string
  email: string
  password: string
  role: "student" | "faculty" | "admin"
  firstName?: string
  middleName?: string
  lastName?: string
  contactNumber?: string
  sex?: string
  birthday?: string
  address?: string
  photoUrl?: string
  studentType?: string
  curriculum?: string
  advisoryClass?: string
  employmentType?: string
  academicTitle?: string
  course?: string
  year?: number
  section?: string
  position?: string
  status: "Active" | "Inactive"
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
    studentType: String,
    curriculum: String,
    advisoryClass: String,
    employmentType: String,
    academicTitle: String,
    course: String,
    year: Number,
    section: String,
    position: String,
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
)

export const UserModel =
  (mongoose.models.User as Model<IUser> | undefined) ??
  mongoose.model<IUser>("User", UserSchema)

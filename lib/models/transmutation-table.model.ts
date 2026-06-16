import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ITransmutationEntry {
  min: number
  max: number
  equivalent: number
}

export interface ITransmutationTable extends Document {
  id: string
  name: string
  subjectType: "Lecture" | "Lecture with Lab" | "All"
  isDefault: boolean
  isActive: boolean
  entries: ITransmutationEntry[]
  createdAt: string
  updatedAt: string
}

const TransmutationEntrySchema = new Schema<ITransmutationEntry>(
  {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    equivalent: { type: Number, required: true },
  },
  { _id: false }
)

const TransmutationTableSchema = new Schema<ITransmutationTable>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subjectType: {
      type: String,
      enum: ["Lecture", "Lecture with Lab", "All"],
      default: "All",
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    entries: { type: [TransmutationEntrySchema], default: [] },
  },
  { timestamps: true }
)

TransmutationTableSchema.index({ subjectType: 1, isActive: 1 })

export const TransmutationTableModel =
  (mongoose.models.TransmutationTable as Model<ITransmutationTable> | undefined) ??
  mongoose.model<ITransmutationTable>("TransmutationTable", TransmutationTableSchema)

import mongoose, { Schema, type Document, type Model } from "mongoose"

interface IMember {
  name: string
  role: string
  details: string
  imageUrl?: string
  cloudinaryPublicId?: string
}

interface IContributor {
  name: string
  role: string
  imageUrl?: string
  cloudinaryPublicId?: string
}

interface IProjectFact {
  label: string
  value: string
}

export interface IAbout extends Document {
  teamName: string
  description: string
  acknowledgment: string
  teamPictureUrl?: string
  teamPicturePublicId?: string
  teamMembers: IMember[]
  projectFacts: IProjectFact[]
  pastContributors: IContributor[]
}

const MemberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    details: { type: String, required: true },
    imageUrl: String,
    cloudinaryPublicId: String,
  },
  { _id: false }
)

const ContributorSchema = new Schema<IContributor>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    imageUrl: String,
    cloudinaryPublicId: String,
  },
  { _id: false }
)

const ProjectFactSchema = new Schema<IProjectFact>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
)

const AboutSchema = new Schema<IAbout>(
  {
    teamName: { type: String, default: "GIT LOST" },
    description: { type: String, default: "" },
    acknowledgment: { type: String, default: "" },
    teamPictureUrl: String,
    teamPicturePublicId: String,
    teamMembers: { type: [MemberSchema], default: [] },
    projectFacts: { type: [ProjectFactSchema], default: [] },
    pastContributors: { type: [ContributorSchema], default: [] },
  },
  { timestamps: true }
)

export const AboutModel =
  (mongoose.models.About as Model<IAbout> | undefined) ??
  mongoose.model<IAbout>("About", AboutSchema)

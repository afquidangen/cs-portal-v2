export type GradingCategory = {
  name: string
  weight: number
}

export type SchemeComponent = {
  name: string
  weight: number
  categories: GradingCategory[]
}

export type GradingScheme = {
  id: string
  name: string
  subjectType: "Lecture" | "Lecture with Lab"
  isDefault: boolean
  isActive: boolean
  components: SchemeComponent[]
  labComponents?: SchemeComponent[]
  lectureWeight?: number
  laboratoryWeight?: number
  createdAt: string
  updatedAt: string
}

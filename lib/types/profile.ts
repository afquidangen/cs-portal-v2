export type ProfileDetails = {
  photoUrl: string
  cloudinaryPublicId?: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  contactNumber: string
  sex: string
  birthday: string
  address: string
  deansListVisibility: "public" | "private"
}

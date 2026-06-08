import { GoverningDocumentModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class GoverningDocumentRepository extends BaseRepository {
  constructor() {
    super(GoverningDocumentModel)
  }
}

export const governingDocumentRepository = new GoverningDocumentRepository()

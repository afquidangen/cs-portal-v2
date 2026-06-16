import { connectToDatabase } from "@/lib/mongodb"

export class BaseRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(protected model: any) {}

  async findAll(
    filter: Record<string, unknown> = {},
    includeDeleted = false
  ): Promise<unknown[]> {
    await connectToDatabase()
    const query = includeDeleted
      ? filter
      : { ...filter, isDeleted: { $ne: true } }
    return this.model.find(query).lean()
  }

  async findDeleted(): Promise<unknown[]> {
    await connectToDatabase()
    return this.model.find({ isDeleted: true }).lean()
  }

  async softDelete(filter: Record<string, unknown>): Promise<boolean> {
    await connectToDatabase()
    const result = await this.model.updateMany(filter, {
      $set: { isDeleted: true, deletedAt: new Date() },
    })
    return result.modifiedCount > 0
  }

  async restore(filter: Record<string, unknown>): Promise<boolean> {
    await connectToDatabase()
    const result = await this.model.updateMany(filter, {
      $set: { isDeleted: false, deletedAt: null },
    })
    return result.modifiedCount > 0
  }

  async findById(id: string): Promise<unknown | null> {
    await connectToDatabase()
    return this.model.findOne({ id } as Record<string, unknown>).lean()
  }

  async findOne(filter: Record<string, unknown>): Promise<unknown | null> {
    await connectToDatabase()
    return this.model.findOne(filter).lean()
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    await connectToDatabase()
    return this.model.create(data)
  }

  async update(
    filter: Record<string, unknown>,
    update: Record<string, unknown>
  ): Promise<unknown | null> {
    await connectToDatabase()
    return this.model.findOneAndUpdate(filter, update, { new: true }).lean()
  }

  async delete(filter: Record<string, unknown>): Promise<boolean> {
    await connectToDatabase()
    const result = await this.model.deleteOne(filter)
    return result.deletedCount > 0
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    await connectToDatabase()
    return this.model.countDocuments(filter)
  }

  async upsert(
    filter: Record<string, unknown>,
    data: Record<string, unknown>
  ): Promise<unknown> {
    await connectToDatabase()
    return this.model
      .findOneAndUpdate(filter, { $set: data } as Record<string, unknown>, {
        upsert: true,
        new: true,
      })
      .lean()
  }

  async bulkUpsert(items: Record<string, unknown>[], keyField = "id"): Promise<void> {
    await connectToDatabase()
    await Promise.all(
      items.map((item) =>
        this.model
          .findOneAndUpdate(
            { [keyField]: item[keyField] } as Record<string, unknown>,
            { $set: item } as Record<string, unknown>,
            { upsert: true }
          )
          .lean()
      )
    )
  }

  async deleteMany(filter: Record<string, unknown> = {}): Promise<number> {
    await connectToDatabase()
    const result = await this.model.deleteMany(filter)
    return result.deletedCount
  }
}

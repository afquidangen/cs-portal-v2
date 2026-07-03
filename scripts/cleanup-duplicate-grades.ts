import "dotenv/config"
import { connectToDatabase } from "../lib/mongodb"
import { GradeModel } from "../lib/models/grade.model"

async function main() {
  await connectToDatabase()

  console.log("Finding grade documents with missing or null id...")

  const badDocs = await GradeModel.find({
    $or: [{ id: null }, { id: { $exists: false } }, { id: "" }],
  }).lean()

  console.log(`Found ${badDocs.length} grade documents with missing id.`)

  if (badDocs.length === 0) {
    console.log("No cleanup needed.")
    process.exit(0)
  }

  const groups = new Map<string, typeof badDocs>()

  for (const doc of badDocs) {
    const key = `${doc.studentId}|${doc.code}|${doc.semesterId ?? ""}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(doc)
  }

  let removedCount = 0

  for (const [key, docs] of groups) {
    if (docs.length === 0) continue

    const [studentId, code, semesterId] = key.split("|")

    const goodDoc = await GradeModel.findOne({
      studentId,
      code,
      ...(semesterId ? { semesterId } : { semesterId: { $in: [null, undefined, ""] } }),
      id: { $nin: [null, "", undefined] },
    }).lean()

    for (const doc of docs) {
      if (goodDoc && doc._id.toString() === goodDoc._id.toString()) continue

      await GradeModel.deleteOne({ _id: doc._id })
      removedCount++
      console.log(`  Removed duplicate grade: studentId=${doc.studentId}, code=${doc.code}, _id=${doc._id}`)
    }
  }

  console.log(`\nCleanup complete. Removed ${removedCount} duplicate grade documents.`)
  process.exit(0)
}

main().catch((err) => {
  console.error("Cleanup failed:", err)
  process.exit(1)
})

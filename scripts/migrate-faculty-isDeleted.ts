import "dotenv/config"
import { connectToDatabase } from "../lib/mongodb"
import { FacultyModel } from "../lib/models/faculty.model"
import { UserModel } from "../lib/models/user.model"

async function main() {
  await connectToDatabase()

  console.log("=== Faculty isDeleted Migration ===\n")

  // Load all faculty records
  const allFaculty = await FacultyModel.find({}).lean()
  console.log(`Total faculty records: ${allFaculty.length}`)

  // Load active faculty users (not deleted)
  const allUsers = await UserModel.find({ role: "faculty" }).lean()
  const activeUsers = allUsers.filter((u) => !u.deletedAt)
  const deletedUsers = allUsers.filter((u) => u.deletedAt)

  const activeUserByEmail = new Map<string, (typeof activeUsers)[number]>()
  for (const u of activeUsers) {
    activeUserByEmail.set(u.email?.toLowerCase() ?? "", u)
  }

  const activeUserById = new Map<string, (typeof activeUsers)[number]>()
  for (const u of activeUsers) {
    activeUserById.set(u.id, u)
  }

  const deletedUserEmails = new Set<string>()
  for (const u of deletedUsers) {
    deletedUserEmails.add(u.email?.toLowerCase() ?? "")
  }

  // Part A: Records missing isDeleted
  const missingIsDeleted = allFaculty.filter((f) => f.isDeleted === undefined)
  console.log(`Records missing isDeleted field: ${missingIsDeleted.length}`)

  let setActiveCount = 0
  let setDeletedCount = 0

  for (const fr of missingIsDeleted) {
    const email = fr.email?.toLowerCase() ?? ""
    const hasActiveUser = activeUserByEmail.has(email)
    const hasDeletedUser = deletedUserEmails.has(email)

    if (hasActiveUser) {
      // There is an active user for this email → mark as active
      await FacultyModel.updateOne(
        { _id: fr._id },
        { $set: { isDeleted: false, deletedAt: null } }
      )
      setActiveCount++
      console.log(`  ACTIVE: ${fr.name} (${fr.email})`)
    } else if (hasDeletedUser) {
      // User was deleted → mark faculty as deleted
      await FacultyModel.updateOne(
        { _id: fr._id },
        { $set: { isDeleted: true, deletedAt: new Date().toISOString() } }
      )
      setDeletedCount++
      console.log(`  DELETED: ${fr.name} (${fr.email})`)
    } else {
      // No user at all for this email → mark as deleted (orphan)
      await FacultyModel.updateOne(
        { _id: fr._id },
        { $set: { isDeleted: true, deletedAt: new Date().toISOString() } }
      )
      setDeletedCount++
      console.log(`  ORPHAN: ${fr.name} (${fr.email})`)
    }
  }

  console.log(`\n  → ${setActiveCount} marked active, ${setDeletedCount} marked deleted`)

  // Part B: Duplicate emails — only one faculty record per email should be active
  const groups = new Map<string, typeof allFaculty>()
  const refreshedFaculty = await FacultyModel.find({ isDeleted: { $ne: true } }).lean()

  for (const fr of refreshedFaculty) {
    const email = fr.email?.toLowerCase() ?? ""
    if (!email) continue
    if (!groups.has(email)) groups.set(email, [])
    groups.get(email)!.push(fr)
  }

  let dedupRemoved = 0

  for (const [email, records] of groups) {
    if (records.length <= 1) continue

    console.log(`\n  Duplicate email: ${email} (${records.length} records)`)
    let best: (typeof records)[number] | null = null

    // Find the record whose id matches an active user
    for (const r of records) {
      if (activeUserById.has(r.id)) {
        best = r
        break
      }
    }

    // Fallback: keep the one whose email matches an active user
    if (!best) {
      const active = activeUserByEmail.get(email)
      if (active) {
        for (const r of records) {
          if (r.email?.toLowerCase() === active.email?.toLowerCase()) {
            best = r
            break
          }
        }
      }
    }

    // Fallback: keep the first one
    if (!best) best = records[0]

    // Soft-delete all others
    for (const r of records) {
      if (r._id.toString() === best._id.toString()) {
        console.log(`    KEEP: ${r.name} (${r.id})`)
      } else {
        await FacultyModel.updateOne(
          { _id: r._id },
          { $set: { isDeleted: true, deletedAt: new Date().toISOString() } }
        )
        dedupRemoved++
        console.log(`    REMOVE: ${r.name} (${r.id})`)
      }
    }
  }

  if (dedupRemoved > 0) {
    console.log(`\n  → Removed ${dedupRemoved} duplicate record(s)`)
  } else {
    console.log(`\n  → No duplicate emails found`)
  }

  // Summary
  const finalCount = await FacultyModel.countDocuments({ isDeleted: { $ne: true } })
  const deletedCount = await FacultyModel.countDocuments({ isDeleted: true })
  console.log(`\n=== Migration Complete ===`)
  console.log(`Active faculty records: ${finalCount}`)
  console.log(`Deleted faculty records: ${deletedCount}`)
  process.exit(0)
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})

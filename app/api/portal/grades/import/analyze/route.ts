import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { analyzeWorkbook } from "@/features/portal/lib/excel-import-engine"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return badRequest("No file uploaded.")

    const buffer = Buffer.from(await file.arrayBuffer())
    const analysis = analyzeWorkbook(buffer)

    if (analysis.sheets.length === 0) {
      return badRequest("Workbook contains no readable sheets.")
    }

    return success(analysis)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to analyze file.")
  }
}

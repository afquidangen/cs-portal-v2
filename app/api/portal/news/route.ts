import { newsRepository } from "@/features/portal/repositories/news.repository"
import { success, error } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const news = await newsRepository.findLatest()
    return success(news)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch news.")
  }
}

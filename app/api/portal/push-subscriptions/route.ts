import { connectToDatabase } from "@/lib/mongodb"
import { PushSubscriptionModel } from "@/lib/models/push-subscription.model"
import { UserModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"
import { requireAuth } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { endpoint, p256dhKey, authKey } = body

    if (!endpoint || !p256dhKey || !authKey) {
      return badRequest("endpoint, p256dhKey, and authKey are required.")
    }

    await connectToDatabase()

    const user = auth.user as unknown as { id: string }
    if (!user.id) {
      return error("User not found.")
    }

    const existing = await PushSubscriptionModel.findOne({
      userId: user.id,
      endpoint,
    })

    if (existing) {
      existing.p256dhKey = p256dhKey
      existing.authKey = authKey
      await existing.save()
      return success({ id: existing.id })
    }

    const subscription = await PushSubscriptionModel.create({
      id: `push_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: user.id,
      endpoint,
      p256dhKey,
      authKey,
    })

    return success({ id: subscription.id }, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to save push subscription.")
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get("endpoint")

    if (!endpoint) {
      return badRequest("endpoint query parameter is required.")
    }

    await connectToDatabase()

    const user = auth.user as unknown as { id: string }

    await PushSubscriptionModel.deleteOne({
      userId: user.id,
      endpoint,
    })

    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete push subscription.")
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { enabled } = body

    if (typeof enabled !== "boolean") {
      return badRequest("enabled boolean field is required.")
    }

    await connectToDatabase()

    const user = auth.user as unknown as { id: string }

    await UserModel.updateOne(
      { id: user.id },
      { $set: { pushNotificationsEnabled: enabled } }
    )

    return success({ pushNotificationsEnabled: enabled })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update push preference.")
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    await connectToDatabase()

    const user = auth.user as unknown as { id: string }

    const subscriptions = await PushSubscriptionModel.find({
      userId: user.id,
    })
      .lean()
      .select("endpoint p256dhKey authKey createdAt")

    return success({ subscriptions, pushNotificationsEnabled: (auth.user as unknown as { pushNotificationsEnabled?: boolean }).pushNotificationsEnabled ?? true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch push subscriptions.")
  }
}

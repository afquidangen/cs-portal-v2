export function success<T>(data: T, status = 200) {
  return Response.json({ data }, { status })
}

export function error(message: string, status = 500) {
  return Response.json({ error: message }, { status })
}

export function notFound(entity = "Resource") {
  return error(`${entity} not found.`, 404)
}

export function badRequest(message: string) {
  return error(message, 400)
}

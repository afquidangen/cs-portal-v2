export function downloadFile(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function csvEscape(value: string | number | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

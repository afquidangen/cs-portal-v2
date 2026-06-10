"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function to12h(time: string): string {
  if (!time) return ""
  const [h, m] = time.split(":")
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

export function to24h(hour12: number, minute: string, ampm: string): string {
  let h = hour12
  if (ampm === "PM" && hour12 !== 12) h += 12
  if (ampm === "AM" && hour12 === 12) h = 0
  return `${String(h).padStart(2, "0")}:${minute}`
}

export function formatScheduleTime(time: string): string {
  if (!time) return ""
  return time.split(" - ").map(to12h).join(" - ")
}

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

export function TimePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const hour24 = value ? parseInt(value.split(":")[0] ?? "0", 10) : 0
  const minute = value ? value.split(":")[1] ?? "00" : "00"
  const hour12 = hour24 % 12 || 12
  const ampm = hour24 >= 12 ? "PM" : "AM"

  return (
    <div className={`flex gap-1 ${className ?? ""}`}>
      <Select
        value={String(hour12).padStart(2, "0")}
        onValueChange={(h) => onChange(to24h(parseInt(h, 10), minute, ampm))}
      >
        <SelectTrigger className="w-20 h-10 rounded-md border border-border bg-white text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border border-border bg-white text-foreground max-h-48">
          {hours.map((h) => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="flex items-center text-foreground/60 font-medium">:</span>
      <Select
        value={minute}
        onValueChange={(m) => onChange(to24h(hour12, m, ampm))}
      >
        <SelectTrigger className="w-20 h-10 rounded-md border border-border bg-white text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border border-border bg-white text-foreground max-h-48">
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={ampm}
        onValueChange={(a) => onChange(to24h(hour12, minute, a))}
      >
        <SelectTrigger className="w-20 h-10 rounded-md border border-border bg-white text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border border-border bg-white text-foreground">
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

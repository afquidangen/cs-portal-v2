"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ArrowLeft, Search, User, Loader2 } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type StudentResult = {
  id: string
  name: string
  photoUrl: string
  currentYearLevel: string
  section: string
  course: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentDirectoryDialog({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery("")
      setResults([])
      setSelectedStudent(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set("q", query.trim())
        const res = await fetch(`/api/portal/students/search?${params}`)
        const json = await res.json()
        setResults(json.data ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, open])

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o && selectedStudent) {
        setSelectedStudent(null)
        return
      }
      onOpenChange(o)
    }}>
      <DialogContent className="sm:max-w-md max-h-[80dvh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle>Student Directory</DialogTitle>
          <DialogDescription>
            Find students in your program.
          </DialogDescription>
        </DialogHeader>

        {!selectedStudent && (
          <>
            <div className="px-5 pb-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find students in your program..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-[200px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((student) => (
                    <button
                      type="button"
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="flex w-full items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent text-left"
                    >
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                        {student.photoUrl ? (
                          <Image
                            src={student.photoUrl}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <User className="size-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {student.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {student.currentYearLevel || "N/A"} &bull; {student.section || "No section"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.trim().length >= 2 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <User className="size-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">No students found in your program.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="size-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Start typing to search for students in your program.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {selectedStudent && (
          <div className="flex flex-col items-center px-5 pb-5">
            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="self-start mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to search
            </button>

            <div className="relative size-28 shrink-0 overflow-hidden rounded-full bg-muted mb-5">
              {selectedStudent.photoUrl ? (
                <Image
                  src={selectedStudent.photoUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <User className="size-12" />
                </div>
              )}
            </div>

            <p className="text-lg font-semibold text-foreground text-center">
              {selectedStudent.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground text-center">
              {selectedStudent.currentYearLevel || "N/A"} &bull; {selectedStudent.section || "No section"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

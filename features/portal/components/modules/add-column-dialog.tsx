"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AddColumnDialog({
  open,
  onOpenChange,
  onConfirm,
  availableCategories,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string, category: string, maxScore: number) => void
  availableCategories: string[]
}) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState(availableCategories[0] || "")
  const [maxScore, setMaxScore] = useState("100")

  function handleConfirm() {
    if (!name.trim()) return
    onConfirm(name.trim(), category || "Custom", Number(maxScore) || 100)
    setName("")
    setMaxScore("100")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Grade Column</DialogTitle>
          <DialogDescription>
            Create a new editable column in the grading table.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Column Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Quiz 1, Project, Assignment"
              className="rounded-lg"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className="rounded-lg"
                >
                  {cat}
                </Button>
              ))}
              {category && !availableCategories.includes(category) && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1 text-sm">
                  {category}
                  <button
                    type="button"
                    onClick={() => setCategory(availableCategories[0] || "")}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Max Score</label>
            <Input
              type="number"
              min="1"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="rounded-lg w-32"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-lg">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="rounded-lg"
          >
            <Plus className="size-4" />
            Add Column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

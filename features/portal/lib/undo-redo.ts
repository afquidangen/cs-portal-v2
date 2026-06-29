export type GridSnapshot = {
  rowData: Record<string, unknown>[]
  columns: Array<{ field: string; width?: number; order: number }>
}

export class UndoRedoManager {
  private undoStack: GridSnapshot[] = []
  private redoStack: GridSnapshot[] = []
  private maxSize = 50

  push(snapshot: GridSnapshot): void {
    this.undoStack.push(snapshot)
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift()
    }
    this.redoStack = []
  }

  undo(): GridSnapshot | null {
    const snapshot = this.undoStack.pop()
    if (!snapshot) return null
    return snapshot
  }

  redo(): GridSnapshot | null {
    const snapshot = this.redoStack.pop()
    if (!snapshot) return null
    return snapshot
  }

  pushForRedo(snapshot: GridSnapshot): void {
    this.redoStack.push(snapshot)
    if (this.redoStack.length > this.maxSize) {
      this.redoStack.shift()
    }
  }

  pushToUndo(snapshot: GridSnapshot): void {
    this.undoStack.push(snapshot)
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift()
    }
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }
}

export function buildSnapshot(
  rowData: Record<string, unknown>[],
  columns: Array<{ field: string; width?: number; order: number }>
): GridSnapshot {
  return {
    rowData: JSON.parse(JSON.stringify(rowData)),
    columns: JSON.parse(JSON.stringify(columns)),
  }
}

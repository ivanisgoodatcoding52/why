"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"

const BLOCK_SHAPES = [
  [[1]],
  [[1, 1]],
  [[1, 1, 1]],
  [[1], [1]],
  [[1], [1], [1]],
  [
    [1, 1],
    [1, 0],
  ],
  [
    [1, 0],
    [1, 1],
  ],
  [
    [1, 1],
    [0, 1],
  ],
  [
    [0, 1],
    [1, 1],
  ],
  // Square
  [
    [1, 1],
    [1, 1],
  ],
  // T shape
  [
    [1, 1, 1],
    [0, 1, 0],
  ],
  // Z shapes
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
]

const GRID_SIZE = 10
const BLOCK_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
]

type GridCell = {
  filled: boolean
  color: string
}

type Block = {
  shape: number[][]
  color: string
  id: number
}

export default function BlockBlastGame() {
  const [grid, setGrid] = useState<GridCell[][]>(() =>
    Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({ filled: false, color: "" })),
      ),
  )
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [nextBlocks, setNextBlocks] = useState<Block[]>([])
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null)
  const [previewPosition, setPreviewPosition] = useState<{ row: number; col: number } | null>(null)

  // Generate random blocks
  const generateBlocks = useCallback(() => {
    const blocks: Block[] = []
    for (let i = 0; i < 3; i++) {
      const shape = BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)]
      const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)]
      blocks.push({ shape, color, id: Date.now() + i })
    }
    return blocks
  }, [])

  useEffect(() => {
    setNextBlocks(generateBlocks())
  }, [generateBlocks])

  const canPlaceBlock = useCallback(
    (block: Block, startRow: number, startCol: number) => {
      for (let row = 0; row < block.shape.length; row++) {
        for (let col = 0; col < block.shape[row].length; col++) {
          if (block.shape[row][col] === 1) {
            const gridRow = startRow + row
            const gridCol = startCol + col
            if (
              gridRow < 0 ||
              gridRow >= GRID_SIZE ||
              gridCol < 0 ||
              gridCol >= GRID_SIZE ||
              grid[gridRow][gridCol].filled
            ) {
              return false
            }
          }
        }
      }
      return true
    },
    [grid],
  )

  const placeBlock = useCallback(
    (block: Block, startRow: number, startCol: number) => {
      const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))

      for (let row = 0; row < block.shape.length; row++) {
        for (let col = 0; col < block.shape[row].length; col++) {
          if (block.shape[row][col] === 1) {
            const gridRow = startRow + row
            const gridCol = startCol + col
            newGrid[gridRow][gridCol] = { filled: true, color: block.color }
          }
        }
      }

      setGrid(newGrid)

      setNextBlocks((prev) => prev.filter((b) => b.id !== block.id))

      clearLines(newGrid)
    },
    [grid],
  )

  const clearLines = useCallback((currentGrid: GridCell[][]) => {
    const newGrid = currentGrid.map((row) => row.map((cell) => ({ ...cell })))
    let linesCleared = 0

    for (let row = 0; row < GRID_SIZE; row++) {
      if (newGrid[row].every((cell) => cell.filled)) {
        for (let col = 0; col < GRID_SIZE; col++) {
          newGrid[row][col] = { filled: false, color: "" }
        }
        linesCleared++
      }
    }

    for (let col = 0; col < GRID_SIZE; col++) {
      if (newGrid.every((row) => row[col].filled)) {
        for (let row = 0; row < GRID_SIZE; row++) {
          newGrid[row][col] = { filled: false, color: "" }
        }
        linesCleared++
      }
    }

    if (linesCleared > 0) {
      setGrid(newGrid)
      setScore((prev) => prev + linesCleared * 100)
    }
  }, [])

  const checkGameOver = useCallback(() => {
    for (const block of nextBlocks) {
      for (let row = 0; row <= GRID_SIZE - block.shape.length; row++) {
        for (let col = 0; col <= GRID_SIZE - block.shape[0].length; col++) {
          if (canPlaceBlock(block, row, col)) {
            return false
          }
        }
      }
    }
    return true
  }, [nextBlocks, canPlaceBlock])

  useEffect(() => {
    if (nextBlocks.length === 0) {
      setNextBlocks(generateBlocks())
    }
  }, [nextBlocks, generateBlocks])

  useEffect(() => {
    if (nextBlocks.length > 0 && checkGameOver()) {
      setGameOver(true)
    }
  }, [nextBlocks, checkGameOver])

  const handleDragStart = (e: React.DragEvent, block: Block) => {
    setDraggedBlock(block)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault()
    if (draggedBlock && canPlaceBlock(draggedBlock, row, col)) {
      setPreviewPosition({ row, col })
      e.dataTransfer.dropEffect = "move"
    } else {
      setPreviewPosition(null)
      e.dataTransfer.dropEffect = "none"
    }
  }

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault()
    if (draggedBlock && canPlaceBlock(draggedBlock, row, col)) {
      placeBlock(draggedBlock, row, col)
    }
    setDraggedBlock(null)
    setPreviewPosition(null)
  }

  const resetGame = () => {
    setGrid(
      Array(GRID_SIZE)
        .fill(null)
        .map(() =>
          Array(GRID_SIZE)
            .fill(null)
            .map(() => ({ filled: false, color: "" })),
        ),
    )
    setScore(0)
    setGameOver(false)
    setNextBlocks(generateBlocks())
    setDraggedBlock(null)
    setPreviewPosition(null)
  }

  const shouldShowPreview = (row: number, col: number) => {
    if (!draggedBlock || !previewPosition) return false

    const relativeRow = row - previewPosition.row
    const relativeCol = col - previewPosition.col

    return (
      relativeRow >= 0 &&
      relativeRow < draggedBlock.shape.length &&
      relativeCol >= 0 &&
      relativeCol < draggedBlock.shape[0].length &&
      draggedBlock.shape[relativeRow][relativeCol] === 1
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <div className="text-2xl font-bold mb-2">{score}</div>
      </div>

      <div className="grid grid-cols-10 gap-1 bg-muted p-2 rounded-lg">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                w-8 h-8 border border-border rounded-sm transition-all duration-200
                ${cell.filled ? cell.color : "bg-background hover:bg-muted"}
                ${shouldShowPreview(rowIndex, colIndex) ? "bg-primary/30 border-primary" : ""}
              `}
              onDragOver={(e) => handleDragOver(e, rowIndex, colIndex)}
              onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
            />
          )),
        )}
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        {nextBlocks.map((block) => (
          <div
            key={block.id}
            className={`p-3 cursor-grab active:cursor-grabbing transition-transform hover:scale-105 bg-card rounded-lg border ${
              gameOver ? "opacity-50 cursor-not-allowed" : ""
            }`}
            draggable={!gameOver}
            onDragStart={(e) => handleDragStart(e, block)}
          >
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${block.shape[0].length}, 1fr)` }}>
              {block.shape.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-6 h-6 rounded-sm ${cell === 1 ? block.color : "bg-transparent"}`}
                  />
                )),
              )}
            </div>
          </div>
        ))}
      </div>

      <Button onClick={resetGame} className="bg-primary hover:bg-primary/90 w-12 h-12 rounded-full">
        ↻
      </Button>
    </div>
  )
}

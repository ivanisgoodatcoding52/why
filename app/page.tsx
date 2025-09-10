import BlockBlastGame from "@/components/block-blast-game"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-foreground">Block Blast</h1>
        <BlockBlastGame />
      </div>
    </main>
  )
}

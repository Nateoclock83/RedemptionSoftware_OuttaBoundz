import QuickProductEntry from "@/components/quick-product-entry"

export default function QuickEntryPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Outta Boundz</h1>
          <p className="text-gray-600">Quick Product Entry</p>
        </header>

        <QuickProductEntry />
      </div>
    </main>
  )
}

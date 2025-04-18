"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Trash2, Download, Plus, Edit2, Scan, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define the prize item type
interface PrizeItem {
  id: string
  productName: string
  upcCode: string
  unitCost: number
  ticketValue: number
  isEditing?: boolean
}

// Define the ticket range intervals
interface TicketRange {
  min: number
  max: number
  interval: number
}

export default function RedemptionPrizeManager() {
  // State for the form inputs
  const [productName, setProductName] = useState("")
  const [upcCode, setUpcCode] = useState("")
  const [unitCost, setUnitCost] = useState("")
  const [quickUPC, setQuickUPC] = useState("")

  // State for the list of prizes
  const [prizes, setPrizes] = useState<PrizeItem[]>([])

  // State for the currently editing prize
  const [editingPrize, setEditingPrize] = useState<PrizeItem | null>(null)

  // State for validation errors
  const [errors, setErrors] = useState<{
    productName?: string
    upcCode?: string
    unitCost?: string
    quickUPC?: string
  }>({})

  // State for alert message
  const [alert, setAlert] = useState<string | null>(null)

  // State for preview DPL content
  const [previewContent, setPreviewContent] = useState<string>("")

  // Refs for inputs
  const upcInputRef = useRef<HTMLInputElement>(null)
  const quickUpcInputRef = useRef<HTMLInputElement>(null)
  const downloadLinkRef = useRef<HTMLAnchorElement>(null)

  // Expanded ticket ranges and intervals
  const ticketRanges: TicketRange[] = [
    { min: 0, max: 100, interval: 5 },
    { min: 100, max: 1000, interval: 25 },
    { min: 1000, max: 1500, interval: 50 },
    { min: 1500, max: 2000, interval: 150 },
    { min: 2000, max: 3000, interval: 200 },
    { min: 3000, max: 7500, interval: 500 },
    { min: 7500, max: 15000, interval: 1000 },
    { min: 15000, max: Number.POSITIVE_INFINITY, interval: 2500 },
  ]

  // Focus the quick UPC input on component mount
  useEffect(() => {
    if (quickUpcInputRef.current) {
      quickUpcInputRef.current.focus()
    }
  }, [])

  // Function to calculate raw ticket amount
  const calculateRawTicketAmount = (cost: number): number => {
    // Step 1: Convert price to base ticket value (price ÷ 0.01)
    const baseTickets = cost / 0.01
    // Step 2: Apply 3.0x markup
    return baseTickets * 3.0
  }

  // Function to round up to the next interval based on ticket ranges
  const roundUpToInterval = (ticketAmount: number): number => {
    // Find the appropriate range
    const range = ticketRanges.find((range) => ticketAmount >= range.min && ticketAmount <= range.max)

    // If no range matches, use the last interval
    const interval = range ? range.interval : ticketRanges[ticketRanges.length - 1].interval

    // Round up to the next interval
    return Math.ceil(ticketAmount / interval) * interval
  }

  // Function to validate form inputs
  const validateForm = () => {
    const newErrors: {
      productName?: string
      upcCode?: string
      unitCost?: string
    } = {}

    if (!productName.trim()) {
      newErrors.productName = "Product name is required"
    }

    if (!upcCode.trim()) {
      newErrors.upcCode = "UPC code is required"
    }

    if (!unitCost.trim()) {
      newErrors.unitCost = "Unit cost is required"
    } else {
      const cost = Number.parseFloat(unitCost)
      if (isNaN(cost) || cost <= 0) {
        newErrors.unitCost = "Unit cost must be a positive number"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Function to validate quick UPC input
  const validateQuickUPC = () => {
    const newErrors: { quickUPC?: string } = {}

    if (!quickUPC.trim()) {
      newErrors.quickUPC = "UPC code is required"
    }

    setErrors((prev) => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const cost = Number.parseFloat(unitCost)

    // Calculate ticket value
    const rawTicketAmount = calculateRawTicketAmount(cost)
    const finalTicketAmount = roundUpToInterval(rawTicketAmount)

    // Create new prize item
    const newPrize: PrizeItem = {
      id: Date.now().toString(),
      productName: productName.trim(),
      upcCode: upcCode.trim(),
      unitCost: cost,
      ticketValue: finalTicketAmount,
    }

    // Add to prizes list
    setPrizes([...prizes, newPrize])

    // Reset form
    setProductName("")
    setUpcCode("")
    setUnitCost("")
    setErrors({})

    // Show success message
    setAlert("Prize added successfully")
    setTimeout(() => setAlert(null), 3000)

    // Focus back on UPC input for quick entry
    if (upcInputRef.current) {
      upcInputRef.current.focus()
    }
  }

  // Function to handle quick UPC submission
  const handleQuickUPCSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateQuickUPC()) {
      return
    }

    // Check if UPC already exists
    const existingPrize = prizes.find((prize) => prize.upcCode === quickUPC.trim())

    if (existingPrize) {
      // Show alert that UPC already exists
      setAlert(`UPC ${quickUPC} already exists in the list`)
      setTimeout(() => setAlert(null), 3000)
    } else {
      // Open the full form with UPC pre-filled
      setUpcCode(quickUPC.trim())

      // Focus on product name input
      setTimeout(() => {
        const productNameInput = document.getElementById("product-name")
        if (productNameInput) {
          productNameInput.focus()
        }
      }, 100)
    }

    // Reset quick UPC input
    setQuickUPC("")
    setErrors((prev) => ({ ...prev, quickUPC: undefined }))
  }

  // Function to remove a prize
  const removePrize = (id: string) => {
    setPrizes(prizes.filter((prize) => prize.id !== id))
  }

  // Function to open edit dialog for a prize
  const openEditDialog = (prize: PrizeItem) => {
    setEditingPrize({ ...prize })
  }

  // Function to save edited prize
  const saveEditedPrize = () => {
    if (!editingPrize) return

    // Validate edited prize
    if (!editingPrize.productName.trim() || !editingPrize.upcCode.trim() || editingPrize.unitCost <= 0) {
      setAlert("Please fill in all fields correctly")
      return
    }

    // Recalculate ticket value
    const rawTicketAmount = calculateRawTicketAmount(editingPrize.unitCost)
    const finalTicketAmount = roundUpToInterval(rawTicketAmount)

    // Update prize in list
    setPrizes(
      prizes.map((prize) =>
        prize.id === editingPrize.id ? { ...editingPrize, ticketValue: finalTicketAmount } : prize,
      ),
    )

    // Close dialog
    setEditingPrize(null)

    // Show success message
    setAlert("Prize updated successfully")
    setTimeout(() => setAlert(null), 3000)
  }

  // Function to clear all prizes
  const clearAll = () => {
    setPrizes([])
  }

  // Function to generate DPL file content
  const generateDPLContent = () => {
    // Header row
    let content = "UPC,Product Name,EACH,1,Unit Cost,Ticket Value,1,Unit Cost,RET\n"

    // Data rows
    prizes.forEach((prize) => {
      content += `${prize.upcCode},${prize.productName},EACH,1,${prize.unitCost.toFixed(2)},${prize.ticketValue},1,${prize.unitCost.toFixed(2)},RET\n`
    })

    return content
  }

  // Function to preview DPL file
  const previewDPL = () => {
    if (prizes.length === 0) {
      setAlert("No prizes to preview")
      setTimeout(() => setAlert(null), 3000)
      return
    }

    const content = generateDPLContent()
    setPreviewContent(content)
  }

  // Function to download DPL file
  const downloadDPL = () => {
    if (prizes.length === 0) {
      setAlert("No prizes to export")
      setTimeout(() => setAlert(null), 3000)
      return
    }

    const content = generateDPLContent()
    const blob = new Blob([content], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = url
      downloadLinkRef.current.download = `redemption_prizes_${new Date().toISOString().split("T")[0]}.dpl`
      downloadLinkRef.current.click()
    }
  }

  return (
    <div className="grid gap-8">
      {alert && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription>{alert}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="quick-entry">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick-entry">Quick UPC Entry</TabsTrigger>
          <TabsTrigger value="full-form">Full Prize Form</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-entry">
          <Card>
            <CardHeader>
              <CardTitle>Quick UPC Entry</CardTitle>
              <CardDescription>Scan or enter UPC code to quickly add a new prize</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickUPCSubmit} className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="quick-upc" className="text-lg font-semibold">
                    UPC Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="quick-upc"
                      ref={quickUpcInputRef}
                      placeholder="Scan or enter UPC code"
                      value={quickUPC}
                      onChange={(e) => setQuickUPC(e.target.value)}
                      className={`text-lg ${errors.quickUPC ? "border-red-500" : ""}`}
                      autoComplete="off"
                    />
                    <Button type="submit">
                      <Scan className="mr-2 h-4 w-4" /> Scan
                    </Button>
                  </div>
                  {errors.quickUPC && <p className="text-red-500 text-sm">{errors.quickUPC}</p>}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="full-form">
          <Card>
            <CardHeader>
              <CardTitle>Add Redemption Prize</CardTitle>
              <CardDescription>Enter complete prize details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      placeholder="e.g. Stuffed Animal"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className={errors.productName ? "border-red-500" : ""}
                    />
                    {errors.productName && <p className="text-red-500 text-sm">{errors.productName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="upc-code">UPC Code</Label>
                    <Input
                      id="upc-code"
                      ref={upcInputRef}
                      placeholder="e.g. 123456789012"
                      value={upcCode}
                      onChange={(e) => setUpcCode(e.target.value)}
                      className={errors.upcCode ? "border-red-500" : ""}
                    />
                    {errors.upcCode && <p className="text-red-500 text-sm">{errors.upcCode}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit-cost">Unit Cost ($)</Label>
                    <Input
                      id="unit-cost"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 5.99"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      className={errors.unitCost ? "border-red-500" : ""}
                    />
                    {errors.unitCost && <p className="text-red-500 text-sm">{errors.unitCost}</p>}
                  </div>
                </div>

                <Button type="submit" className="w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Add Prize
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Prize List</CardTitle>
            <CardDescription>Manage your redemption prizes</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-red-500" disabled={prizes.length === 0}>
                  Clear All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear All Prizes</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove all prizes? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={clearAll}>
                    Clear All
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={previewDPL}
                  disabled={prizes.length === 0}
                >
                  <Eye className="mr-2 h-4 w-4" /> Preview DPL
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>DPL File Preview</DialogTitle>
                  <DialogDescription>Preview of the DPL file that will be exported</DialogDescription>
                </DialogHeader>
                <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">{previewContent}</pre>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                  <Button onClick={downloadDPL}>
                    <Download className="mr-2 h-4 w-4" /> Download DPL
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="default"
              className="flex items-center"
              onClick={downloadDPL}
              disabled={prizes.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Download DPL
            </Button>

            {/* Hidden download link */}
            <a ref={downloadLinkRef} className="hidden" />
          </div>
        </CardHeader>
        <CardContent>
          {prizes.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No prizes added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>UPC Code</TableHead>
                    <TableHead>Unit Cost ($)</TableHead>
                    <TableHead>Ticket Value</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prizes.map((prize) => (
                    <TableRow key={prize.id}>
                      <TableCell>{prize.productName}</TableCell>
                      <TableCell>{prize.upcCode}</TableCell>
                      <TableCell>${prize.unitCost.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">{prize.ticketValue}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(prize)}>
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removePrize(prize.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">Total Items: {prizes.length}</p>
        </CardFooter>
      </Card>

      {/* Edit Prize Dialog */}
      {editingPrize && (
        <Dialog open={!!editingPrize} onOpenChange={(open) => !open && setEditingPrize(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Prize</DialogTitle>
              <DialogDescription>Make changes to the prize information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-product-name" className="text-right">
                  Product Name
                </Label>
                <Input
                  id="edit-product-name"
                  value={editingPrize.productName}
                  onChange={(e) => setEditingPrize({ ...editingPrize, productName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-upc-code" className="text-right">
                  UPC Code
                </Label>
                <Input
                  id="edit-upc-code"
                  value={editingPrize.upcCode}
                  onChange={(e) => setEditingPrize({ ...editingPrize, upcCode: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-unit-cost" className="text-right">
                  Unit Cost ($)
                </Label>
                <Input
                  id="edit-unit-cost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editingPrize.unitCost}
                  onChange={(e) => setEditingPrize({ ...editingPrize, unitCost: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Ticket Value</Label>
                <div className="col-span-3 font-medium">
                  {roundUpToInterval(calculateRawTicketAmount(editingPrize.unitCost))}
                  <span className="text-sm text-gray-500 ml-2">(Calculated automatically)</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPrize(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedPrize}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

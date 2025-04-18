"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Download, Eye, Trash2, Edit2 } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define the product type
interface Product {
  id: string
  name: string
  sku: string // Added SKU field
  upcCode: string
  unitType: string
  quantity: number
  totalCost: number
  ticketValue: number
  itemsPerUnit: number
  unitCost: number
  type: string
}

// Define the ticket range intervals
interface TicketRange {
  min: number
  max: number
  interval: number
}

export default function ProductEntryWithExport() {
  // State for the form inputs
  const [productName, setProductName] = useState("")
  const [productSku, setProductSku] = useState("") // Added SKU state
  const [upcCode, setUpcCode] = useState("")
  const [unitType, setUnitType] = useState("EACH")
  const [quantity, setQuantity] = useState("")
  const [totalCost, setTotalCost] = useState("")
  const [itemsPerUnit, setItemsPerUnit] = useState("")
  const [unitCost, setUnitCost] = useState("")
  const [type, setType] = useState("RET")

  // State for the list of products
  const [products, setProducts] = useState<Product[]>([])

  // State for the currently editing product
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // State for alert message
  const [alert, setAlert] = useState<string | null>(null)

  // State for preview DPL content
  const [previewContent, setPreviewContent] = useState<string>("")

  // Ref for file download
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

  // Function to calculate unit cost from total cost and items per unit
  const calculateUnitCost = (totalCost: number, itemsPerUnit: number): number => {
    return totalCost / itemsPerUnit
  }

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!validateForm()) {
      return
    }

    const totalCostValue = Number.parseFloat(totalCost)
    const quantityValue = Number.parseInt(quantity)
    const itemsPerUnitValue = Number.parseInt(itemsPerUnit)
    const unitCostValue = Number.parseFloat(unitCost)

    // Calculate ticket value based on unit cost
    const rawTicketAmount = calculateRawTicketAmount(unitCostValue)
    const finalTicketAmount = roundUpToInterval(rawTicketAmount)

    // Create new product
    const newProduct: Product = {
      id: Date.now().toString(),
      name: productName.trim(),
      sku: productSku.trim(), // Added SKU
      upcCode: upcCode.trim(),
      unitType: unitType,
      quantity: quantityValue,
      totalCost: totalCostValue,
      ticketValue: finalTicketAmount,
      itemsPerUnit: itemsPerUnitValue,
      unitCost: unitCostValue,
      type: type,
    }

    // Add to products list
    setProducts([...products, newProduct])

    // Reset form
    resetForm()

    // Show success message
    setAlert("Product added successfully")
    setTimeout(() => setAlert(null), 3000)
  }

  // Function to validate form inputs
  const validateForm = (): boolean => {
    if (!productName.trim()) {
      setAlert("Product name is required")
      setTimeout(() => setAlert(null), 3000)
      return false
    }

    if (!upcCode.trim()) {
      setAlert("UPC code is required")
      setTimeout(() => setAlert(null), 3000)
      return false
    }

    if (!quantity.trim() || Number.parseInt(quantity) <= 0) {
      setAlert("Quantity must be a positive number")
      setTimeout(() => setAlert(null), 3000)
      return false
    }

    if (!totalCost.trim() || Number.parseFloat(totalCost) <= 0) {
      setAlert("Total cost must be a positive number")
      setTimeout(() => setAlert(null), 3000)
      return false
    }

    if (!itemsPerUnit.trim() || Number.parseInt(itemsPerUnit) <= 0) {
      setAlert("Items per unit must be a positive number")
      setTimeout(() => setAlert(null), 3000)
      return false
    }

    if (!unitCost.trim() || Number.parseFloat(unitCost) <= 0) {
      setAlert("Unit cost must be a positive number")
      setTimeout(() => setAlert(null), 3000)
      return false
    }

    return true
  }

  // Function to reset form
  const resetForm = () => {
    setProductName("")
    setProductSku("") // Reset SKU
    setUpcCode("")
    setUnitType("EACH")
    setQuantity("")
    setTotalCost("")
    setItemsPerUnit("")
    setUnitCost("")
    setType("RET")
  }

  // Function to remove a product
  const removeProduct = (id: string) => {
    setProducts(products.filter((product) => product.id !== id))
  }

  // Function to open edit dialog for a product
  const openEditDialog = (product: Product) => {
    setEditingProduct({ ...product })
  }

  // Function to save edited product
  const saveEditedProduct = () => {
    if (!editingProduct) return

    // Validate edited product
    if (
      !editingProduct.name.trim() ||
      !editingProduct.upcCode.trim() ||
      editingProduct.quantity <= 0 ||
      editingProduct.totalCost <= 0 ||
      editingProduct.itemsPerUnit <= 0 ||
      editingProduct.unitCost <= 0
    ) {
      setAlert("Please fill in all fields correctly")
      setTimeout(() => setAlert(null), 3000)
      return
    }

    // Recalculate ticket value
    const rawTicketAmount = calculateRawTicketAmount(editingProduct.unitCost)
    const finalTicketAmount = roundUpToInterval(rawTicketAmount)

    // Update product in list
    setProducts(
      products.map((product) =>
        product.id === editingProduct.id ? { ...editingProduct, ticketValue: finalTicketAmount } : product,
      ),
    )

    // Close dialog
    setEditingProduct(null)

    // Show success message
    setAlert("Product updated successfully")
    setTimeout(() => setAlert(null), 3000)
  }

  // Function to generate DPL file content
  const generateDPLContent = () => {
    let content = ""

    // Data rows - ensure all products are included
    if (products.length > 0) {
      products.forEach((product) => {
        // Include SKU in the product name if it exists
        const productNameWithSku = product.sku ? `${product.sku}-${product.name}` : product.name

        content += `${product.upcCode},${productNameWithSku},${product.unitType},${product.quantity},${product.totalCost.toFixed(2)},${product.ticketValue},${product.itemsPerUnit},${product.unitCost.toFixed(2)},${product.type}\n`
      })
    }

    return content
  }

  // Function to preview DPL file
  const previewDPL = () => {
    if (products.length === 0) {
      setAlert("No products to preview")
      setTimeout(() => setAlert(null), 3000)
      return
    }

    const content = generateDPLContent()
    setPreviewContent(content)
  }

  // Function to download DPL file
  const downloadDPL = () => {
    if (products.length === 0) {
      setAlert("No products to export")
      setTimeout(() => setAlert(null), 3000)
      return
    }

    const content = generateDPLContent()

    // Create blob and download
    const blob = new Blob([content], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = url
      downloadLinkRef.current.download = `outta_boundz_products_${new Date().toISOString().split("T")[0]}.dpl`
      downloadLinkRef.current.click()

      // Clean up
      URL.revokeObjectURL(url)
    }
  }

  // Function to handle unit cost calculation when total cost or items per unit changes
  const handleTotalCostChange = (value: string) => {
    setTotalCost(value)

    if (value && itemsPerUnit) {
      const totalCostValue = Number.parseFloat(value)
      const itemsPerUnitValue = Number.parseInt(itemsPerUnit)

      if (!isNaN(totalCostValue) && !isNaN(itemsPerUnitValue) && itemsPerUnitValue > 0) {
        const calculatedUnitCost = calculateUnitCost(totalCostValue, itemsPerUnitValue)
        setUnitCost(calculatedUnitCost.toFixed(2))
      }
    }
  }

  const handleItemsPerUnitChange = (value: string) => {
    setItemsPerUnit(value)

    if (totalCost && value) {
      const totalCostValue = Number.parseFloat(totalCost)
      const itemsPerUnitValue = Number.parseInt(value)

      if (!isNaN(totalCostValue) && !isNaN(itemsPerUnitValue) && itemsPerUnitValue > 0) {
        const calculatedUnitCost = calculateUnitCost(totalCostValue, itemsPerUnitValue)
        setUnitCost(calculatedUnitCost.toFixed(2))
      }
    }
  }

  return (
    <div className="grid gap-8">
      {alert && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription>{alert}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add Product for DPL Export</CardTitle>
          <CardDescription>Enter product details matching your vendor's format</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upc-code">UPC Code</Label>
                <Input
                  id="upc-code"
                  placeholder="e.g. 632365900291"
                  value={upcCode}
                  onChange={(e) => setUpcCode(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-sku">Product SKU</Label>
                <Input
                  id="product-sku"
                  placeholder="e.g. GLOPOP"
                  value={productSku}
                  onChange={(e) => setProductSku(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  placeholder="e.g. Glow-in-the-Dark Ping Pong Popper"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit-type">Unit Type</Label>
                <Select value={unitType} onValueChange={setUnitType}>
                  <SelectTrigger id="unit-type">
                    <SelectValue placeholder="Select unit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EACH">EACH</SelectItem>
                    <SelectItem value="CASE">CASE</SelectItem>
                    <SelectItem value="INNER">INNER</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="e.g. 6"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-cost">Total Cost ($)</Label>
                <Input
                  id="total-cost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 5.32"
                  value={totalCost}
                  onChange={(e) => handleTotalCostChange(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="items-per-unit">Items Per Unit</Label>
                <Input
                  id="items-per-unit"
                  type="number"
                  min="1"
                  placeholder="e.g. 1"
                  value={itemsPerUnit}
                  onChange={(e) => handleItemsPerUnitChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit-cost">Unit Cost ($)</Label>
                <Input
                  id="unit-cost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 5.32"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RET">RET</SelectItem>
                    <SelectItem value="SOW">SOW</SelectItem>
                    <SelectItem value="RED">RED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Calculated Ticket Value</Label>
              <div className="p-2 bg-gray-100 rounded-md font-medium">
                {unitCost ? roundUpToInterval(calculateRawTicketAmount(Number(unitCost))) : 0}
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto">
              Add Product
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product List for DPL Export</CardTitle>
            <CardDescription>Manage your products and export to DPL</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={previewDPL}
                  disabled={products.length === 0}
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
              disabled={products.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Download DPL
            </Button>

            {/* Hidden download link */}
            <a ref={downloadLinkRef} className="hidden" />
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No products added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UPC Code</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Unit Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Ticket Value</TableHead>
                    <TableHead>Items/Unit</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.upcCode}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.unitType}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>${product.totalCost.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">{product.ticketValue}</TableCell>
                      <TableCell>{product.itemsPerUnit}</TableCell>
                      <TableCell>${product.unitCost.toFixed(2)}</TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeProduct(product.id)}>
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
          <p className="text-sm text-gray-500">Total Items: {products.length}</p>
        </CardFooter>
      </Card>

      {/* Edit Product Dialog */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Make changes to the product information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-upc-code" className="text-right">
                  UPC Code
                </Label>
                <Input
                  id="edit-upc-code"
                  value={editingProduct.upcCode}
                  onChange={(e) => setEditingProduct({ ...editingProduct, upcCode: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-product-sku" className="text-right">
                  Product SKU
                </Label>
                <Input
                  id="edit-product-sku"
                  value={editingProduct.sku}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-product-name" className="text-right">
                  Product Name
                </Label>
                <Input
                  id="edit-product-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-unit-type" className="text-right">
                  Unit Type
                </Label>
                <Select
                  value={editingProduct.unitType}
                  onValueChange={(value) => setEditingProduct({ ...editingProduct, unitType: value })}
                >
                  <SelectTrigger id="edit-unit-type" className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EACH">EACH</SelectItem>
                    <SelectItem value="CASE">CASE</SelectItem>
                    <SelectItem value="INNER">INNER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-quantity" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  value={editingProduct.quantity}
                  onChange={(e) => setEditingProduct({ ...editingProduct, quantity: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-total-cost" className="text-right">
                  Total Cost ($)
                </Label>
                <Input
                  id="edit-total-cost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editingProduct.totalCost}
                  onChange={(e) => {
                    const newTotalCost = Number(e.target.value)
                    const newUnitCost = calculateUnitCost(newTotalCost, editingProduct.itemsPerUnit)
                    setEditingProduct({
                      ...editingProduct,
                      totalCost: newTotalCost,
                      unitCost: newUnitCost,
                    })
                  }}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-items-per-unit" className="text-right">
                  Items Per Unit
                </Label>
                <Input
                  id="edit-items-per-unit"
                  type="number"
                  min="1"
                  value={editingProduct.itemsPerUnit}
                  onChange={(e) => {
                    const newItemsPerUnit = Number(e.target.value)
                    const newUnitCost = calculateUnitCost(editingProduct.totalCost, newItemsPerUnit)
                    setEditingProduct({
                      ...editingProduct,
                      itemsPerUnit: newItemsPerUnit,
                      unitCost: newUnitCost,
                    })
                  }}
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
                  value={editingProduct.unitCost}
                  onChange={(e) => setEditingProduct({ ...editingProduct, unitCost: Number(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-type" className="text-right">
                  Type
                </Label>
                <Select
                  value={editingProduct.type}
                  onValueChange={(value) => setEditingProduct({ ...editingProduct, type: value })}
                >
                  <SelectTrigger id="edit-type" className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RET">RET</SelectItem>
                    <SelectItem value="SOW">SOW</SelectItem>
                    <SelectItem value="RED">RED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Ticket Value</Label>
                <div className="col-span-3 font-medium">
                  {roundUpToInterval(calculateRawTicketAmount(editingProduct.unitCost))}
                  <span className="text-sm text-gray-500 ml-2">(Calculated automatically)</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedProduct}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

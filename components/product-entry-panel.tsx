"use client"

import type React from "react"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import ProductEntryWithExport from "./product-entry-with-export"

// Define the product type
interface Product {
  id: string
  name: string
  price: number
  ticketAmount: number
}

// Define the ticket range intervals
interface TicketRange {
  min: number
  max: number
  interval: number
}

export default function ProductEntryPanel() {
  // State for the form inputs
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")

  // State for the list of products
  const [products, setProducts] = useState<Product[]>([])

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
  const calculateRawTicketAmount = (price: number): number => {
    // Step 1: Convert price to base ticket value (price ÷ 0.01)
    const baseTickets = price / 0.01
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

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!productName.trim() || !productPrice.trim()) {
      return
    }

    const price = Number.parseFloat(productPrice)
    if (isNaN(price) || price <= 0) {
      return
    }

    // Calculate raw ticket amount
    const rawTicketAmount = calculateRawTicketAmount(price)

    // Round up to the appropriate interval
    const finalTicketAmount = roundUpToInterval(rawTicketAmount)

    // Create new product with calculated ticket amount
    const newProduct: Product = {
      id: Date.now().toString(),
      name: productName.trim(),
      price: price,
      ticketAmount: finalTicketAmount,
    }

    // Add to products list
    setProducts([...products, newProduct])

    // Reset form
    setProductName("")
    setProductPrice("")
  }

  // Function to remove a product
  const removeProduct = (id: string) => {
    setProducts(products.filter((product) => product.id !== id))
  }

  return (
    <div className="grid gap-8">
      {/* Original Product Entry Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Product Entry</CardTitle>
          <CardDescription>Enter product details to calculate ticket amounts</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  placeholder="e.g. Hockey Sticks"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Price ($)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 18.99"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No products added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Price ($)</TableHead>
                  <TableHead>Ticket Amount</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">{product.ticketAmount}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeProduct(product.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New UPC Entry and Export Component */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">DPL Export Tool</h2>
        <ProductEntryWithExport />
      </div>
    </div>
  )
}

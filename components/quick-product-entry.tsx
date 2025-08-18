"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

export default function QuickProductEntry() {
  // State for the form inputs
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")

  // State for the list of products
  const [products, setProducts] = useState<Product[]>([])

  // State for alert message
  const [alert, setAlert] = useState<string | null>(null)

  // Add localStorage key constant
  const STORAGE_KEY = "outtaBoundzQuickProducts"

  // Add useEffect for loading data from localStorage on component mount
  useEffect(() => {
    // Load saved products from localStorage when component mounts
    const savedProducts = localStorage.getItem(STORAGE_KEY)
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts)
        setProducts(parsedProducts)
        setAlert("Loaded saved products from your browser")
        setTimeout(() => setAlert(null), 3000)
      } catch (error) {
        console.error("Error loading saved products:", error)
      }
    }
  }, [])

  // Add useEffect for saving data to localStorage whenever products change
  useEffect(() => {
    // Save products to localStorage whenever they change
    if (products.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    }
  }, [products])

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
      setAlert("Please fill in all fields")
      setTimeout(() => setAlert(null), 3000)
      return
    }

    const price = Number.parseFloat(productPrice)
    if (isNaN(price) || price <= 0) {
      setAlert("Price must be a positive number")
      setTimeout(() => setAlert(null), 3000)
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

    // Show success message
    setAlert("Product added successfully")
    setTimeout(() => setAlert(null), 3000)
  }

  // Function to remove a product
  const removeProduct = (id: string) => {
    setProducts(products.filter((product) => product.id !== id))
  }

  // Function to clear all products
  const clearAll = () => {
    if (window.confirm("Are you sure you want to clear all products? This action cannot be undone.")) {
      setProducts([])
      localStorage.removeItem(STORAGE_KEY)
      setAlert("All products cleared")
      setTimeout(() => setAlert(null), 3000)
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Product List</CardTitle>
          {products.length > 0 && (
            <Button variant="outline" className="text-red-500" onClick={clearAll}>
              Clear All
            </Button>
          )}
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
    </div>
  )
}

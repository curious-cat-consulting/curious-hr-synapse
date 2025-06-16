import { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { useToast } from "@components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

const EXPENSE_CATEGORIES = [
  "Travel",
  "Meals",
  "Office Supplies",
  "Software",
  "Hardware",
  "Marketing",
  "Training",
  "Professional Services",
  "Other",
];

const MILES_CATEGORIES = ["Client Meeting", "Airport", "Delivery", "Commute", "Other"];

interface AddLineItemButtonProps {
  expenseId: string;
  onLineItemAdded: () => void;
  expenseStatus: string;
}

export function AddLineItemButton({
  expenseId,
  onLineItemAdded,
  expenseStatus,
}: Readonly<AddLineItemButtonProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<string>("regular");

  // Regular fields
  const [category, setCategory] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<string>("");

  // Miles fields
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [milesCategory, setMilesCategory] = useState<string>("");
  const [milesDriven, setMilesDriven] = useState<string>("");
  const [calculatedMiles, setCalculatedMiles] = useState<string>("");
  const [customMiles, setCustomMiles] = useState<string>("");
  const [milesTotalAmount, setMilesTotalAmount] = useState<string>("");

  const [lineItemDate, setLineItemDate] = useState<string>("");

  const { toast } = useToast();
  const canAddLineItem = ["ANALYZED", "NEW", "PENDING"].includes(expenseStatus);

  // Simulate miles calculation
  useEffect(() => {
    if (type === "miles" && fromAddress && toAddress) {
      // Simple calculation: 10 miles if addresses are different, 0 if same
      const miles = fromAddress !== toAddress ? 10 : 0;
      setCalculatedMiles(miles.toString());
      setMilesDriven(miles.toString());
      setCustomMiles("");
      setMilesTotalAmount((miles * 0.655).toFixed(2)); // IRS 2023 rate
    }
  }, [type, fromAddress, toAddress]);

  // Update total for regular
  useEffect(() => {
    if (type === "regular" && quantity && unitPrice) {
      const total = Number(quantity) * Number(unitPrice);
      setTotalAmount(total.toFixed(2));
    }
  }, [type, quantity, unitPrice]);

  // Update total for miles if custom miles is set
  useEffect(() => {
    if (type === "miles") {
      const miles = customMiles || milesDriven;
      if (miles) {
        setMilesTotalAmount((Number(miles) * 0.655).toFixed(2));
      }
    }
  }, [type, customMiles, milesDriven]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (type === "regular") {
      const formData = new FormData(e.currentTarget);
      const lineItem = {
        expense_id: expenseId,
        description: formData.get("description"),
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
        total_amount: Number(totalAmount),
        category: category || formData.get("category"),
        is_ai_generated: false,
        line_item_date: lineItemDate,
      };
      try {
        const response = await fetch(`/api/expenses/${expenseId}/line-items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lineItem),
        });
        if (!response.ok) throw new Error("Failed to add line item");
        toast({ title: "Success", description: "Line item added successfully" });
        onLineItemAdded();
        setIsOpen(false);
        setCategory("");
        setQuantity("1");
        setUnitPrice("");
        setTotalAmount("");
        (e.target as HTMLFormElement).reset();
      } catch (error) {
        console.error("Error adding line item:", error);
        toast({ title: "Error", description: "Failed to add line item", variant: "destructive" });
      }
    } else if (type === "miles") {
      const mileageLineItem = {
        from_address: fromAddress,
        to_address: toAddress,
        category: milesCategory,
        miles_driven: Number(customMiles || milesDriven),
        calculated_miles: Number(calculatedMiles),
        custom_miles: customMiles ? Number(customMiles) : null,
        total_amount: Number(milesTotalAmount),
        line_item_date: lineItemDate,
      };
      try {
        const response = await fetch(`/api/expenses/${expenseId}/mileage-line-items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mileageLineItem),
        });
        if (!response.ok) throw new Error("Failed to add mileage line item");
        toast({ title: "Success", description: "Mileage line item added successfully" });
        onLineItemAdded();
        setIsOpen(false);
        setFromAddress("");
        setToAddress("");
        setMilesCategory("");
        setMilesDriven("");
        setCalculatedMiles("");
        setCustomMiles("");
        setMilesTotalAmount("");
        (e.target as HTMLFormElement).reset();
      } catch (error) {
        console.error("Error adding mileage line item:", error);
        toast({
          title: "Error",
          description: "Failed to add mileage line item",
          variant: "destructive",
        });
      }
    }
  };

  if (!canAddLineItem) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Line Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="miles">Miles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="line_item_date">Date</Label>
            <Input
              id="line_item_date"
              name="line_item_date"
              type="date"
              value={lineItemDate}
              onChange={(e) => setLineItemDate(e.target.value)}
              required
            />
          </div>

          {type === "regular" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" required />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!category && (
                  <Input
                    id="category"
                    name="category"
                    className="mt-2"
                    placeholder="Or type your own category"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit_price">Unit Price</Label>
                <Input
                  id="unit_price"
                  name="unit_price"
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="total_amount">Total Amount</Label>
                <Input
                  id="total_amount"
                  name="total_amount"
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  readOnly
                  required
                />
              </div>
            </div>
          )}

          {type === "miles" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="from_address">From Address</Label>
                <Input
                  id="from_address"
                  name="from_address"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="to_address">To Address</Label>
                <Input
                  id="to_address"
                  name="to_address"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="miles_category">Category</Label>
                <Select value={milesCategory} onValueChange={setMilesCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {MILES_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="miles_driven">Miles Driven</Label>
                <Input
                  id="miles_driven"
                  name="miles_driven"
                  type="number"
                  step="0.01"
                  value={customMiles || milesDriven}
                  onChange={(e) => setCustomMiles(e.target.value)}
                  required
                />
                <div className="mt-1 text-xs text-gray-500">
                  Calculated: {calculatedMiles} mi (edit to override)
                </div>
              </div>
              <div>
                <Label htmlFor="miles_total_amount">Total Amount</Label>
                <Input
                  id="miles_total_amount"
                  name="miles_total_amount"
                  type="number"
                  step="0.01"
                  value={milesTotalAmount}
                  readOnly
                  required
                />
                <div className="mt-1 text-xs text-gray-500">Rate: $0.655/mi</div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full">
            Add Line Item
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

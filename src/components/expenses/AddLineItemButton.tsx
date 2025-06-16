import { useState } from "react";
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

interface AddLineItemButtonProps {
  expenseId: string;
  onLineItemAdded: () => void;
}

export function AddLineItemButton({
  expenseId,
  onLineItemAdded,
}: Readonly<AddLineItemButtonProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<string>("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const lineItem = {
      expense_id: expenseId,
      description: formData.get("description"),
      quantity: Number(formData.get("quantity")),
      unit_price: Number(formData.get("unit_price")),
      total_amount: Number(formData.get("total_amount")),
      category: category || formData.get("category"),
      is_ai_generated: false,
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

      toast({
        title: "Success",
        description: "Line item added successfully",
      });

      onLineItemAdded();
      setIsOpen(false);
      setCategory("");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error adding line item:", error);
      toast({
        title: "Error",
        description: "Failed to add line item",
        variant: "destructive",
      });
    }
  };

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
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Add Line Item
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

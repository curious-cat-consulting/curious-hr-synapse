"use client";

import { useEffect, useState } from "react";

import { AddressAutocomplete } from "@components/ui/address-autocomplete";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

interface MileageLineItemFormProps {
  categories: string[];
  mileageRate: number;
  onSubmit: (formData: any) => void;
  isSubmitting: boolean;
  onTotalChange?: (total: number) => void;
}

export function MileageLineItemForm({
  categories,
  mileageRate,
  onSubmit,
  onTotalChange,
}: Readonly<MileageLineItemFormProps>) {
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [milesCategory, setMilesCategory] = useState("");
  const [milesDriven, setMilesDriven] = useState("");
  const [milesTotalAmount, setMilesTotalAmount] = useState("");

  // Update total for miles using useEffect for better reactivity
  useEffect(() => {
    if (milesDriven !== "") {
      const total = Number(milesDriven) * mileageRate;
      setMilesTotalAmount(total.toFixed(2));
      onTotalChange?.(total);
    } else {
      setMilesTotalAmount("");
      onTotalChange?.(0);
    }
  }, [milesDriven, mileageRate, onTotalChange]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    onSubmit({
      fromAddress,
      toAddress,
      milesCategory,
      milesDriven,
      milesTotalAmount,
      mileageRate,
    });
  };

  return (
    <form id="mileage-line-item-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="col-span-2">
        <AddressAutocomplete
          id="from_address"
          label="From Address"
          value={fromAddress}
          onChange={setFromAddress}
          placeholder="Enter starting address"
          required
        />
      </div>

      <div className="col-span-2">
        <AddressAutocomplete
          id="to_address"
          label="To Address"
          value={toAddress}
          onChange={setToAddress}
          placeholder="Enter destination address"
          required
        />
      </div>

      <div>
        <Label htmlFor="miles_category">Category</Label>
        <Select value={milesCategory} onValueChange={setMilesCategory}>
          <SelectTrigger id="miles_category" name="miles_category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
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
          step="0.1"
          value={milesDriven}
          onChange={(e) => setMilesDriven(e.target.value)}
          required
        />
      </div>
    </form>
  );
}

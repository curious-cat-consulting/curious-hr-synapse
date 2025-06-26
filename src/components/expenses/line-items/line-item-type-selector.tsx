"use client";

import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

interface LineItemTypeSelectorProps {
  type: "regular" | "miles";
  onTypeChange: (type: "regular" | "miles") => void;
  lineItemDate: string;
  onLineItemDateChange: (date: string) => void;
}

export function LineItemTypeSelector({
  type,
  onTypeChange,
  lineItemDate,
  onLineItemDateChange,
}: Readonly<LineItemTypeSelectorProps>) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={(value: "regular" | "miles") => onTypeChange(value)}>
          <SelectTrigger id="type" name="type">
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
          onChange={(e) => onLineItemDateChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
}

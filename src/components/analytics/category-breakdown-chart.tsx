import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryBreakdownChartProps {
  data: Array<{
    category: string;
    line_item_count: number;
    total_amount: number;
  }>;
}

export function CategoryBreakdownChart({ data }: Readonly<CategoryBreakdownChartProps>) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      const data = payload[0];

      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">No category data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} interval={0} />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="total_amount" fill="#8b5cf6" name="Total Amount" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

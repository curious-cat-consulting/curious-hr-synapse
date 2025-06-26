import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyTrendsChartProps {
  data?: Array<{
    month: string;
    expense_count: number;
    total_amount: number;
  }> | null;
}

export function MonthlyTrendsChart({ data }: Readonly<MonthlyTrendsChartProps>) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (monthString: string) => {
    try {
      return format(new Date(monthString), "MMM yyyy");
    } catch {
      return monthString;
    }
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<any>;
    label?: string;
  }) => {
    if (active === true && payload != null && payload.length > 0) {
      const expenseData = payload[0];
      const amountData = payload[1];

      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <p className="font-medium">{label != null ? formatMonth(label) : "Unknown"}</p>
          <p className="text-sm text-muted-foreground">Expenses: {expenseData.value}</p>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(amountData.value)}</p>
        </div>
      );
    }
    return null;
  };

  if (data == null || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">No trend data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="expense_count"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Expense Count"
          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="total_amount"
          stroke="#10b981"
          strokeWidth={2}
          name="Total Amount ($)"
          dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

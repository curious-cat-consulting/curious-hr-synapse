import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MemberPerformanceChartProps {
  data:
    | Array<{
        member_name: string;
        expense_count: number;
        total_amount: number;
        avg_amount: number;
      }>
    | null
    | undefined;
}

export function MemberPerformanceChart({ data }: Readonly<MemberPerformanceChartProps>) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active === true && payload != null && payload.length > 0) {
      const expenseData = payload[0];
      const amountData = payload[1];

      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">Expenses: {expenseData.value}</p>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(amountData.value)}</p>
        </div>
      );
    }
    return null;
  };

  // Handle null/undefined data by providing empty array fallback
  const chartData = data ?? [];

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">No member data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="member_name" angle={-45} textAnchor="end" height={80} interval={0} />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="expense_count"
          fill="#3b82f6"
          name="Expense Count"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          yAxisId="right"
          dataKey="total_amount"
          fill="#10b981"
          name="Total Amount ($)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

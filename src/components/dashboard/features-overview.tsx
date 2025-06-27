import { Users, Shield, TrendingUp, Receipt, Bell } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  iconBgColor: string;
  iconColor: string;
}

interface FeaturesOverviewProps {
  title: string;
  features: Feature[];
}

export function FeaturesOverview({ title, features }: FeaturesOverviewProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.iconBgColor}`}
                >
                  <div className={feature.iconColor}>{feature.icon}</div>
                </div>
                <div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {feature.features.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center gap-2">
                    <div className="h-4 w-4 text-green-500">✓</div>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Predefined feature sets
export const teamFeatures: Feature[] = [
  {
    icon: <Users className="h-5 w-5" />,
    title: "Team Management",
    description: "Manage members and roles",
    features: [
      "Invite and manage team members",
      "Approve and reject expenses",
      "Role-based permissions",
    ],
    iconBgColor: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "AI-Powered Review",
    description: "Automated validation",
    features: ["Fraud detection", "Duplicate detection", "Policy compliance checks"],
    iconBgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Advanced Analytics",
    description: "Insights and reporting",
    features: ["Spending trends", "Category breakdowns", "Export capabilities"],
    iconBgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
];

export const personalFeatures: Feature[] = [
  {
    icon: <Receipt className="h-5 w-5" />,
    title: "Smart Expense Submission",
    description: "AI-powered receipt processing",
    features: [
      "Upload receipts via photo or file",
      "Automatic data extraction",
      "Smart categorization",
    ],
    iconBgColor: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Real-time Tracking",
    description: "Stay updated on your expenses",
    features: ["Instant notifications", "Status tracking", "Approval updates"],
    iconBgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Expense History",
    description: "Complete expense management",
    features: ["Complete expense history", "Search and filter", "Export capabilities"],
    iconBgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
];

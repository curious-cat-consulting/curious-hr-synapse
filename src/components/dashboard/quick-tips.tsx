import { Receipt, Download, Bell } from "lucide-react";

import { Card, CardContent } from "@components/ui/card";

interface QuickTip {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBgColor: string;
  iconColor: string;
}

interface QuickTipsProps {
  title: string;
  tips: QuickTip[];
}

export function QuickTips({ title, tips }: QuickTipsProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tips.map((tip, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${tip.iconBgColor}`}
                >
                  <div className={tip.iconColor}>{tip.icon}</div>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold">{tip.title}</h4>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Predefined tips for personal dashboard
export const personalQuickTips: QuickTip[] = [
  {
    icon: <Receipt className="h-4 w-4" />,
    title: "Better Receipt Photos",
    description:
      "Take photos in good lighting with the entire receipt visible for best AI accuracy.",
    iconBgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: <Download className="h-4 w-4" />,
    title: "Export Your Data",
    description: "Export your expense history to CSV or Excel for record keeping and tax purposes.",
    iconBgColor: "bg-green-100 rounded-full",
    iconColor: "text-green-600",
  },
  {
    icon: <Bell className="h-4 w-4" />,
    title: "Stay Notified",
    description: "Enable notifications to stay updated on expense status and important updates.",
    iconBgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

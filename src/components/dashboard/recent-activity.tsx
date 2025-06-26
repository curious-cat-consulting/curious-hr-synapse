import { Clock } from "lucide-react";

import { Card, CardContent } from "@components/ui/card";

interface RecentActivityProps {
  title: string;
  message: string;
}

export function RecentActivity({ title, message }: RecentActivityProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
      <Card>
        <CardContent className="pt-6">
          <div className="py-8 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface Props {
  title: string;
  description: string;
}
export default function DashboardTitle({ title, description }: Props) {
  return (
    <div className="mx-auto max-w-screen-xl space-y-0.5">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

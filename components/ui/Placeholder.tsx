import { Topbar } from "@/components/ui/Topbar";
import { Card } from "@/components/ui/Card";

export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col gap-6">
      <Topbar stat={title} />
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      <Card className="flex h-64 items-center justify-center text-muted">
        {note}
      </Card>
    </div>
  );
}

import { Card } from "@/components/retroui/Card";
import { Text } from "@/components/retroui/Text";

type SkeletonPageProps = {
  title: string;
  description?: string;
};

export function SkeletonPage({
  title,
  description = "Coming soon — this chapter is on the roadmap.",
}: SkeletonPageProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <Text as="h1" className="mb-6">
        {title}
      </Text>
      <Card className="border-2 border-black p-6 shadow-md">
        <p className="font-sans text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
}

import { Tree, TreeItem } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModuleAttribute } from "@shared/schema";

interface ModuleTreeProps {
  data?: ModuleAttribute[];
  isLoading: boolean;
  onSelect: (attribute: string) => void;
}

export function ModuleTree({ data, isLoading, onSelect }: ModuleTreeProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Tree className="h-12 w-12 mx-auto mb-2" />
        <p>No module attributes found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {data.map((attr) => (
          <div
            key={attr.name}
            className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer"
            onClick={() => onSelect(attr.name)}
          >
            <TreeItem className="h-4 w-4 mr-2" />
            <span>{attr.name}</span>
            <span className="ml-auto text-sm text-muted-foreground">{attr.type}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

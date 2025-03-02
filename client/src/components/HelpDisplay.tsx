import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, ArrowDown, ArrowUp } from "lucide-react";
import { sendExtensionMessage } from "@/lib/queryClient";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "../hooks/use-debounce";

interface HelpDisplayProps {
  module: string;
}

export function HelpDisplay({ module }: HelpDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const debouncedModule = useDebounce(module, 500); // Increase debounce time to 500ms

  // Only fetch help when module name is complete (no partial names)
  const { data: helpText, isLoading } = useQuery({
    queryKey: ["moduleHelp", debouncedModule],
    queryFn: () => sendExtensionMessage("getModuleHelp", { moduleName: debouncedModule }),
    enabled: !!debouncedModule && debouncedModule === module, // Only fetch when debounced value matches current value
    retry: false, // Don't retry failed requests
    staleTime: Infinity, // Cache the result indefinitely
  });

  // Reset search when module changes
  useEffect(() => {
    setSearchTerm("");
    setCurrentMatch(0);
  }, [module]);

  const matches = useMemo(() => {
    if (!helpText || !searchTerm) return [];
    const regex = new RegExp(searchTerm, 'gi');
    const matches: number[] = [];
    let match;
    while ((match = regex.exec(helpText as string)) !== null) {
      matches.push(match.index);
    }
    return matches;
  }, [helpText, searchTerm]);

  const highlightedText = useMemo(() => {
    if (!helpText || !searchTerm) return helpText as string;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return (helpText as string).split(regex).map((part, i) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        const isCurrentMatch = Math.floor(i / 2) === currentMatch;
        return `<span class="${isCurrentMatch ? 'bg-yellow-300' : 'bg-yellow-100'}">${part}</span>`;
      }
      return part;
    }).join('');
  }, [helpText, searchTerm, currentMatch]);

  if (!module) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <HelpCircle className="h-12 w-12 mx-auto mb-2" />
        <p>Select a module or attribute to view help</p>
      </div>
    );
  }

  if (module !== debouncedModule) {
    return <div className="animate-pulse h-[400px] bg-muted rounded-md flex items-center justify-center">
      <p className="text-muted-foreground">Waiting for typing to complete...</p>
    </div>;
  }

  if (isLoading) {
    return <div className="animate-pulse h-[400px] bg-muted rounded-md flex items-center justify-center">
      <p className="text-muted-foreground">Loading documentation...</p>
    </div>;
  }

  const navigateMatch = (direction: 'next' | 'prev') => {
    if (matches.length === 0) return;
    if (direction === 'next') {
      setCurrentMatch((prev) => (prev + 1) % matches.length);
    } else {
      setCurrentMatch((prev) => (prev - 1 + matches.length) % matches.length);
    }

    // Scroll the current match into view
    const currentElement = document.querySelector('.bg-yellow-300');
    if (currentElement) {
      currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search in documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {matches.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentMatch + 1} of {matches.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMatch('prev')}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMatch('next')}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          <pre 
            className="whitespace-pre-wrap font-mono text-sm"
            dangerouslySetInnerHTML={{ __html: highlightedText || "" }}
          />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
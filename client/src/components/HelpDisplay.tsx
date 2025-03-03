// /PythonLibraryExplorer/client/src/components/HelpDisplay.tsx
import { useQuery } from "@tanstack/react-query";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { HelpCircle, ArrowDown, ArrowUp } from "lucide-react";
import { sendExtensionMessage } from "@/lib/queryClient";
import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "../hooks/use-debounce";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface HelpDisplayProps {
  module: string;
}

export function HelpDisplay({ module }: HelpDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const [searchFilter, setSearchFilter] = useState<"all" | "function" | "class" | "method" | "property">("all");
  const debouncedModule = useDebounce(module, 500);
  const viewportRef = useRef<HTMLDivElement>(null);

  const { data: helpText, isLoading } = useQuery({
    queryKey: ["moduleHelp", debouncedModule],
    queryFn: () => sendExtensionMessage("getModuleHelp", { moduleName: debouncedModule }),
    enabled: !!debouncedModule && debouncedModule === module,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    setSearchTerm("");
    setCurrentMatch(0);
  }, [module]);

  const matches = useMemo(() => {
    if (!helpText || !searchTerm) return [];
    const regex = new RegExp(searchTerm, 'gi');
    const matches: Array<{ index: number, line: number }> = [];
    let match: RegExpExecArray | null;

    const lines = (helpText as string).split('\n');
    let currentIndex = 0;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      const shouldIncludeLine = searchFilter === 'all' ||
        (searchFilter === 'function' && line.includes('function')) ||
        (searchFilter === 'class' && line.includes('class')) ||
        (searchFilter === 'method' && line.includes('method')) ||
        (searchFilter === 'property' && line.includes('property'));

      if (shouldIncludeLine) {
        while ((match = regex.exec(line)) !== null) {
          matches.push({ 
            index: currentIndex + match.index,
            line: lineNum
          });
        }
      }
      currentIndex += line.length + 1;
    }
    return matches;
  }, [helpText, searchTerm, searchFilter]);

  const navigateMatch = (direction: 'next' | 'prev') => {
    if (matches.length === 0) return;

    const newMatch = direction === 'next'
      ? (currentMatch + 1) % matches.length
      : (currentMatch - 1 + matches.length) % matches.length;

    setCurrentMatch(newMatch);

    setTimeout(() => {
      const matchElement = viewportRef.current?.querySelector(`[data-match-index="${newMatch}"]`);
      if (matchElement) {
        matchElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 50);
  };

  const highlightedText = useMemo(() => {
    if (!helpText || !searchTerm) return helpText as string;
    
    const lines = (helpText as string).split('\n');
    let currentIndex = 0;
    const highlightedLines = lines.map((line, lineNum) => {
      const shouldIncludeLine = searchFilter === 'all' ||
        (searchFilter === 'function' && line.includes('function')) ||
        (searchFilter === 'class' && line.includes('class')) ||
        (searchFilter === 'method' && line.includes('method')) ||
        (searchFilter === 'property' && line.includes('property'));

      if (!shouldIncludeLine) {
        currentIndex += line.length + 1;
        return line;
      }

      const regex = new RegExp(`(${searchTerm})`, 'gi');
      let lastIndex = 0;
      let result = '';
      let match: RegExpExecArray | null;

      while ((match = regex.exec(line)) !== null) {
        const matchIndex = matches.findIndex(m => 
          m.line === lineNum && m.index === currentIndex + (match?.index || 0)
        );
        const isCurrentMatch = matchIndex === currentMatch;
        
        result += line.slice(lastIndex, match.index);
        result += `<span class="${isCurrentMatch ? 'bg-yellow-300' : 'bg-yellow-100'}" data-match-index="${matchIndex}">${match[0]}</span>`;
        lastIndex = match.index + match[0].length;
      }

      result += line.slice(lastIndex);
      currentIndex += line.length + 1;
      return result || line;
    });

    return highlightedLines.join('\n');
  }, [helpText, searchTerm, searchFilter, currentMatch, matches]);

  if (!module) {
    return (
      <div id="help-main-container" className="flex h-full flex-col">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex gap-2">
            <div className="h-10 flex-1" />
            <div className="h-10 w-[150px]" />
          </div>
        </div>
        <div className="flex-1 min-h-0 relative">
          <ScrollArea className="absolute inset-0">
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <HelpCircle className="h-12 w-12 mb-4 mx-auto" />
                <p className="text-base">Select a module or attribute to view help</p>
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  if (module !== debouncedModule || isLoading) {
    return (
      <div id="help-main-container" className="flex h-full flex-col">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </div>
        <div className="flex-1 min-h-0 relative">
          <ScrollArea className="absolute inset-0">
            <div id="skeleton-container" className="p-4">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="h-8 w-full bg-muted rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-[90%] bg-muted rounded" />
                  <div className="h-4 w-[95%] bg-muted rounded" />
                  <div className="h-4 w-[85%] bg-muted rounded" />
                </div>
                <div className="h-8 w-[80%] bg-muted rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-[92%] bg-muted rounded" />
                  <div className="h-4 w-[88%] bg-muted rounded" />
                  <div className="h-4 w-[95%] bg-muted rounded" />
                </div>
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  return (
    <div id="help-main-container" className="flex h-full flex-col">
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex gap-2">
          <Input
            type="text"
            placeholder="Search help text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select
            value={searchFilter}
            onValueChange={(value) => setSearchFilter(value as typeof searchFilter)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="function">Functions</SelectItem>
              <SelectItem value="class">Classes</SelectItem>
              <SelectItem value="method">Methods</SelectItem>
              <SelectItem value="property">Properties</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {matches.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
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
      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="absolute inset-0">
          <div id="content-container" ref={viewportRef} className="p-4">
            <pre 
              className="whitespace-pre-wrap font-mono text-sm leading-relaxed break-words max-w-full"
              dangerouslySetInnerHTML={{ __html: highlightedText || "" }}
            />
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
}
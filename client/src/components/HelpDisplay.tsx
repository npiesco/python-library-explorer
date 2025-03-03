// /PythonLibraryExplorer/client/src/components/HelpDisplay.tsx
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, ArrowDown, ArrowUp } from "lucide-react";
import { sendExtensionMessage } from "@/lib/queryClient";
import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "../hooks/use-debounce";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface HelpDisplayProps {
  module: string;
}

export function HelpDisplay({ module }: HelpDisplayProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const [searchFilter, setSearchFilter] = useState<"all" | "function" | "class" | "method" | "property">("all");
  const debouncedModule = useDebounce(module, 500); // Increase debounce time to 500ms
  const viewportRef = useRef<HTMLDivElement>(null);

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
    const matches: Array<{ index: number, line: number }> = [];

    // Split the help text into lines
    const lines = (helpText as string).split('\n');
    let cumulativeIndex = 0;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      // Check if line matches the type filter
      const shouldIncludeLine = searchFilter === 'all' ||
        (searchFilter === 'function' && line.includes('function')) ||
        (searchFilter === 'class' && line.includes('class')) ||
        (searchFilter === 'method' && line.includes('method')) ||
        (searchFilter === 'property' && line.includes('property'));

      if (shouldIncludeLine) {
        let match;
        regex.lastIndex = 0; // Reset regex state
        while ((match = regex.exec(line)) !== null) {
          matches.push({ 
            index: cumulativeIndex + match.index,
            line: lineNum
          });
        }
      }
      cumulativeIndex += line.length + 1; // +1 for newline
    }
    return matches;
  }, [helpText, searchTerm, searchFilter]);

  const navigateMatch = (direction: 'next' | 'prev') => {
    if (matches.length === 0) return;

    const newMatch = direction === 'next'
      ? (currentMatch + 1) % matches.length
      : (currentMatch - 1 + matches.length) % matches.length;

    console.log('Navigating to match:', newMatch);
    console.log('Total matches:', matches.length);

    setCurrentMatch(newMatch);

    // Wait for the DOM to update
    setTimeout(() => {
      const matchElement = document.querySelector(`[data-match-index="${newMatch}"]`);
      console.log('Found match element:', !!matchElement);
      if (matchElement) {
        console.log('Match element position:', matchElement.getBoundingClientRect());
        matchElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 50);
  };

  const highlightedText = useMemo(() => {
    if (!helpText || !searchTerm) return helpText as string;
    
    console.log('Generating highlighted text');
    console.log('Current match:', currentMatch);
    console.log('Number of matches:', matches.length);
    
    // Split the help text into lines
    const lines = (helpText as string).split('\n');
    let cumulativeIndex = 0;
    
    const highlightedLines = lines.map((line, lineNum) => {
      // Check if line matches the type filter
      const shouldIncludeLine = searchFilter === 'all' ||
        (searchFilter === 'function' && line.includes('function')) ||
        (searchFilter === 'class' && line.includes('class')) ||
        (searchFilter === 'method' && line.includes('method')) ||
        (searchFilter === 'property' && line.includes('property'));

      if (!shouldIncludeLine) {
        cumulativeIndex += line.length + 1;
        return line;
      }

      const regex = new RegExp(`(${searchTerm})`, 'gi');
      let lastIndex = 0;
      let result = '';
      let match;

      while ((match = regex.exec(line)) !== null) {
        const globalIndex = cumulativeIndex + match.index;
        const matchIndex = matches.findIndex(m => m.index === globalIndex);
        console.log('Match found in line', lineNum, 'at index', matchIndex);
        const isCurrentMatch = matchIndex === currentMatch;
        
        result += line.slice(lastIndex, match.index);
        result += `<span class="${isCurrentMatch ? 'bg-yellow-300' : 'bg-yellow-100'}" data-match-index="${matchIndex}">${match[0]}</span>`;
        lastIndex = match.index + match[0].length;
      }

      result += line.slice(lastIndex);
      cumulativeIndex += line.length + 1;
      return result || line;
    });

    return highlightedLines.join('\n');
  }, [helpText, searchTerm, searchFilter, currentMatch, matches]);

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

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search in documentation..."
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
        <ScrollArea className="h-[400px]" id="help-scroll-area">
          <div ref={viewportRef} className="relative">
            <pre 
              className="whitespace-pre-wrap font-mono text-sm"
              dangerouslySetInnerHTML={{ __html: highlightedText || "" }}
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
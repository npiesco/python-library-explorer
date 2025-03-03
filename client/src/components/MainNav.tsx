import * as React from "react"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Box, Package, Settings } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useVenvStore } from "@/lib/store"
import { ThemeToggle } from "./ThemeToggle"
import { format } from "date-fns"
import { Skeleton } from "./ui/skeleton"
import type { VirtualEnv, PackageInfo } from "@shared/schema"

export function MainNav() {
  const { data: virtualEnvs = [], isLoading } = useQuery<VirtualEnv[]>({
    queryKey: ['virtualEnvs'] as const,
    queryFn: async () => {
      const response = await fetch('/api/venv');
      return response.json();
    }
  });

  const activeEnv = virtualEnvs.find((env: VirtualEnv) => env.isActive);

  return (
    <div className="flex flex-1 items-center justify-between">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <Package className="mr-2 h-4 w-4" />
              Installed
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[400px] p-4">
                <div className="text-sm text-muted-foreground mb-4">
                  {activeEnv ? (
                    <>Packages installed in {activeEnv.name}</>
                  ) : (
                    <>No active environment selected</>
                  )}
                </div>
                {activeEnv ? (
                  <div className="space-y-2">
                    {activeEnv.packages?.map((pkg: PackageInfo) => (
                      <div key={pkg.name} className="flex items-center justify-between">
                        <span className="font-mono text-sm">{pkg.name}</span>
                        <span className="text-xs text-muted-foreground">{pkg.version}</span>
                      </div>
                    )) ?? (
                      <div className="text-sm text-muted-foreground">No packages installed</div>
                    )}
                  </div>
                ) : null}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <Box className="mr-2 h-4 w-4" />
              Environment
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[400px] p-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : activeEnv ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Active Environment</div>
                      <div className="text-2xl font-bold">{activeEnv.name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Created</div>
                        <div className="font-medium">
                          {format(new Date(activeEnv.createdAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Packages</div>
                        <div className="font-medium">
                          {activeEnv.packages?.length ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Python Version</div>
                        <div className="font-medium">{activeEnv.pythonVersion ?? 'Unknown'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Last Updated</div>
                        <div className="font-medium">
                          {activeEnv.updatedAt 
                            ? format(new Date(activeEnv.updatedAt), 'MMM d, yyyy')
                            : 'Never'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No active environment selected
                  </div>
                )}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[200px] p-4">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Theme</div>
                    <ThemeToggle />
                  </div>
                  {/* Add more settings here */}
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
}) 
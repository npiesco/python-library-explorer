// PythonLibraryExplorer/shared/schema.ts
import { z } from "zod";

export const insertVirtualEnvSchema = z.object({
  name: z.string().min(1, "Environment name is required"),
  path: z.string().min(1, "Path is required"),
  isActive: z.boolean().default(true),
});

export const insertPackageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  version: z.string().default("latest"),
  envId: z.string(),
});

export type PackageInfo = {
  name: string;
  version: string;
};

export type VirtualEnv = {
  id: string;
  name: string;
  path: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  packages?: PackageInfo[];
  pythonVersion?: string;
};

export type InsertVirtualEnv = z.infer<typeof insertVirtualEnvSchema>;
export type InsertPackage = z.infer<typeof insertPackageSchema>;

export const moduleAttributeSchema = z.object({
  name: z.string(),
  type: z.string(),
  help: z.string(),
  children: z.array(z.string()).optional(),
});

export type ModuleAttribute = z.infer<typeof moduleAttributeSchema>;

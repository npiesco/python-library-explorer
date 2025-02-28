import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const virtualEnvs = pgTable("virtual_envs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  isActive: boolean("is_active").notNull().default(false),
});

export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  envId: serial("env_id").references(() => virtualEnvs.id),
});

export const insertVirtualEnvSchema = createInsertSchema(virtualEnvs).pick({
  name: true,
  path: true,
  isActive: true,
});

export const insertPackageSchema = createInsertSchema(packages).pick({
  name: true,
  version: true,
  envId: true,
});

export type InsertVirtualEnv = z.infer<typeof insertVirtualEnvSchema>;
export type VirtualEnv = typeof virtualEnvs.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packages.$inferSelect;

export const moduleAttributeSchema = z.object({
  name: z.string(),
  type: z.string(),
  help: z.string(),
  children: z.array(z.string()).optional(),
});

export type ModuleAttribute = z.infer<typeof moduleAttributeSchema>;

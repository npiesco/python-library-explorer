// PythonLibraryExplorer/server/routes.ts
import type { Express } from "express";
import { createServer } from "http";
import { createPythonEnvironment, installPackage, getModuleAttributes, getModuleHelp, searchModuleAttributes } from "./pythonUtils";
import { insertPackageSchema, insertVirtualEnvSchema } from "@shared/schema";
import { log } from "./vite";
import prisma, {
  createVirtualEnvironment,
  addPackageToEnvironment,
  addModuleToPackage,
  addAttributeToModule,
  getEnvironmentWithPackages
} from "./db";
import { rmSync } from 'fs';

export async function registerRoutes(app: Express) {
  // Add a test endpoint to verify server is responding
  app.get("/api/status", (_req, res) => {
    log("Status endpoint called");
    res.json({ status: "ok" });
  });

  app.get("/api/venv", async (_req, res) => {
    try {
      log("Listing virtual environments");
      const venvs = await prisma.virtualEnvironment.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(venvs);
    } catch (error) {
      log(`Error listing venvs: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.post("/api/venv/create", async (req, res) => {
    try {
      log("Creating virtual environment");
      const data = insertVirtualEnvSchema.parse(req.body);
      
      // Create virtual environment in the filesystem
      await createPythonEnvironment(data.path);
      
      // Create virtual environment record in database
      const venv = await createVirtualEnvironment(data.name, data.path);
      res.json(venv);
    } catch (error) {
      log(`Error creating venv: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/venv/:id", async (req, res) => {
    try {
      const envId = req.params.id;
      const environment = await getEnvironmentWithPackages(envId);
      if (!environment) {
        return res.status(404).json({ error: "Environment not found" });
      }
      res.json(environment);
    } catch (error) {
      log(`Error getting environment: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.post("/api/venv/setActive", async (req, res) => {
    try {
      const { id } = req.body;
      log(`Setting active environment: ${id}`);

      // First, set all environments to inactive
      await prisma.virtualEnvironment.updateMany({
        data: { isActive: false }
      });

      // If id is null, we're just deactivating all environments
      if (id === null) {
        log("Deactivated all environments");
        return res.json({ success: true });
      }

      // Then set the selected environment to active
      const env = await prisma.virtualEnvironment.update({
        where: { id },
        data: { isActive: true }
      });

      log(`Set environment ${env.id} as active`);
      res.json(env);
    } catch (error) {
      log(`Error setting active environment: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  // Add cleanup endpoint
  app.post("/api/venv/cleanup", async (_req, res) => {
    try {
      log("Cleaning up virtual environments");
      // Get all environments
      const envs = await prisma.virtualEnvironment.findMany();
      
      // Delete each environment's directory and database record
      for (const env of envs) {
        try {
          // Skip active environments
          if (env.isActive) continue;
          
          // Delete the virtual environment directory
          rmSync(env.path, { recursive: true, force: true });
          
          // First delete all packages associated with this environment
          await prisma.package.deleteMany({
            where: { envId: env.id }
          });
          
          // Then delete the environment
          await prisma.virtualEnvironment.delete({
            where: { id: env.id }
          });
        } catch (error) {
          log(`Warning: Error cleaning up environment ${env.id}: ${error}`);
        }
      }

      res.json({ success: true });
    } catch (error) {
      log(`Error cleaning up environments: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.post("/api/packages/install", async (req, res) => {
    try {
      log("Installing package with data:", req.body);
      const data = insertPackageSchema.parse(req.body);
      
      // Get the active environment
      const activeEnv = await prisma.virtualEnvironment.findFirst({
        where: { isActive: true }
      });
      
      if (!activeEnv) {
        throw new Error("No active virtual environment");
      }

      log(`Installing package ${data.name} in environment ${activeEnv.path}`);

      // Install package in the virtual environment
      await installPackage(activeEnv.path, data.name, data.version);
      
      log(`Package ${data.name} installed successfully, adding to database`);

      // Add package to database
      const pkg = await addPackageToEnvironment(activeEnv.id, data.name, data.version);
      
      // Get module information and store it
      log(`Getting module attributes for ${data.name}`);
      const moduleAttrs = await getModuleAttributes(data.name, activeEnv.path);
      const module = await addModuleToPackage(pkg.id, data.name);
      
      // Store module attributes
      for (const attr of moduleAttrs) {
        await addAttributeToModule(module.id, attr.name, attr.type);
      }

      log(`Successfully installed and registered package ${data.name}`);
      res.json(pkg);
    } catch (error) {
      log(`Error installing package: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.post("/api/modules/search", async (req, res) => {
    try {
      log(`Searching modules with query: ${JSON.stringify(req.body)}`);
      const { moduleName, query } = req.body;
      
      // Get the active environment
      const activeEnv = await prisma.virtualEnvironment.findFirst({
        where: { isActive: true }
      });
      
      if (!activeEnv) {
        throw new Error("No active virtual environment");
      }

      if (!moduleName) {
        throw new Error("Module name is required");
      }

      // If no query is provided, return all attributes
      if (!query) {
        const attributes = await getModuleAttributes(moduleName, activeEnv.path);
        return res.json(attributes);
      }

      // First try to find in database
      const moduleAttributes = await prisma.moduleAttribute.findMany({
        where: {
          module: {
            name: moduleName
          },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { type: { contains: query, mode: 'insensitive' } },
            { docString: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          module: true
        }
      });

      if (moduleAttributes.length > 0) {
        return res.json(moduleAttributes);
      }

      // If not found in database, search using Python
      const results = await searchModuleAttributes(moduleName, query, activeEnv.path);
      res.json(results);
    } catch (error) {
      log(`Error searching modules: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/modules/:name", async (req, res) => {
    try {
      log(`Getting module attributes for: ${req.params.name}`);
      
      // Get the active environment
      const activeEnv = await prisma.virtualEnvironment.findFirst({
        where: { isActive: true }
      });
      
      if (!activeEnv) {
        throw new Error("No active virtual environment");
      }

      // First try to find in database
      const module = await prisma.module.findFirst({
        where: { name: req.params.name },
        include: { attributes: true }
      });

      if (module) {
        return res.json(module.attributes);
      }

      // If not found in database, get from Python
      const attributes = await getModuleAttributes(req.params.name, activeEnv.path);
      res.json(attributes);
    } catch (error) {
      log(`Error getting module attributes: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/modules/help/:name", async (req, res) => {
    try {
      log(`Getting help for module: ${req.params.name}`);
      
      // Get the active environment
      const activeEnv = await prisma.virtualEnvironment.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      
      if (!activeEnv) {
        throw new Error("No active virtual environment");
      }

      // First try to find in database
      const module = await prisma.module.findFirst({
        where: { name: req.params.name }
      });

      if (module?.docString) {
        return res.json(module.docString);
      }

      // If not found in database, get from Python
      const help = await getModuleHelp(req.params.name, activeEnv.path);
      
      // Store the help text if we found the module
      if (module) {
        await prisma.module.update({
          where: { id: module.id },
          data: { docString: help }
        });
      }

      res.json(help);
    } catch (error) {
      log(`Error getting module help: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.delete("/api/venv/:id", async (req, res) => {
    try {
      const { id } = req.params;
      log(`Deleting environment: ${id}`);
      
      // Get the environment details
      const env = await prisma.virtualEnvironment.findUnique({
        where: { id }
      });

      if (!env) {
        log(`Environment ${id} not found`);
        return res.status(404).json({ error: "Environment not found" });
      }

      if (env.isActive) {
        log(`Cannot delete active environment ${id}`);
        return res.status(400).json({ error: "Cannot delete active environment" });
      }

      // Delete the virtual environment directory
      try {
        log(`Deleting directory: ${env.path}`);
        rmSync(env.path, { recursive: true, force: true });
      } catch (error) {
        log(`Warning: Could not delete directory ${env.path}: ${error}`);
      }

      // Delete the environment (cascade will handle related records)
      log(`Deleting environment from database: ${id}`);
      await prisma.virtualEnvironment.delete({
        where: { id }
      });

      log(`Successfully deleted environment ${id}`);
      res.json({ success: true });
    } catch (error) {
      log(`Error deleting environment: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/modules", async (_req, res) => {
    try {
      // Get the active environment
      const activeEnv = await prisma.virtualEnvironment.findFirst({
        where: { isActive: true }
      });
      
      if (!activeEnv) {
        throw new Error("No active virtual environment");
      }

      const modules = await prisma.module.findMany({
        where: { 
          package: {
            envId: activeEnv.id
          }
        },
        include: { attributes: true }
      });

      res.json(modules);
    } catch (error) {
      log(`Error listing modules: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
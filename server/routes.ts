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

export async function registerRoutes(app: Express) {
  // Add a test endpoint to verify server is responding
  app.get("/api/status", (_req, res) => {
    log("Status endpoint called");
    res.json({ status: "ok" });
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

  app.post("/api/packages/install", async (req, res) => {
    try {
      log("Installing package");
      const data = insertPackageSchema.parse(req.body);
      
      // Get the active environment
      const activeEnv = await prisma.virtualEnvironment.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      
      if (!activeEnv) {
        throw new Error("No active virtual environment");
      }

      // Install package in the virtual environment
      await installPackage(activeEnv.path, data.name, data.version);
      
      // Add package to database
      const pkg = await addPackageToEnvironment(activeEnv.id, data.name, data.version);
      
      // Get module information and store it
      const moduleAttrs = await getModuleAttributes(data.name, activeEnv.path);
      const module = await addModuleToPackage(pkg.id, data.name);
      
      // Store module attributes
      for (const attr of moduleAttrs) {
        await addAttributeToModule(module.id, attr.name, attr.type);
      }

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
      if (!moduleName || !query) {
        throw new Error("Module name and search query are required");
      }

      // Get the active environment
      const activeEnv = await prisma.virtualEnvironment.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      
      if (!activeEnv) {
        throw new Error("No active virtual environment");
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
        orderBy: { createdAt: 'desc' }
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

  const httpServer = createServer(app);
  return httpServer;
}
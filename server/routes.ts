import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { createPythonEnvironment, installPackage, getModuleAttributes, getModuleHelp, searchModuleAttributes } from "./pythonUtils";
import { insertPackageSchema, insertVirtualEnvSchema } from "@shared/schema";
import { log } from "./vite";

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
      const venv = await storage.createVirtualEnv(data);
      await createPythonEnvironment(venv.path);
      res.json(venv);
    } catch (error) {
      log(`Error creating venv: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.post("/api/packages/install", async (req, res) => {
    try {
      log("Installing package");
      const data = insertPackageSchema.parse(req.body);
      const activeEnv = await storage.getActiveVirtualEnv();
      if (!activeEnv) {
        throw new Error("No active virtual environment");
      }

      await installPackage(activeEnv.path, data.name, data.version);
      const pkg = await storage.installPackage(data);
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
      const results = await searchModuleAttributes(moduleName, query);
      res.json(results);
    } catch (error) {
      log(`Error searching modules: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/modules/:name", async (req, res) => {
    try {
      log(`Getting module attributes for: ${req.params.name}`);
      const attributes = await getModuleAttributes(req.params.name);
      res.json(attributes);
    } catch (error) {
      log(`Error getting module attributes: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/modules/help/:name", async (req, res) => {
    try {
      log(`Getting help for module: ${req.params.name}`);
      const help = await getModuleHelp(req.params.name);
      res.json(help);
    } catch (error) {
      log(`Error getting module help: ${error}`);
      res.status(400).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { createPythonEnvironment, installPackage, getModuleAttributes, getModuleHelp } from "./pythonUtils";
import { insertPackageSchema, insertVirtualEnvSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.post("/api/venv/create", async (req, res) => {
    try {
      const data = insertVirtualEnvSchema.parse(req.body);
      const venv = await storage.createVirtualEnv(data);
      await createPythonEnvironment(venv.path);
      res.json(venv);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.post("/api/packages/install", async (req, res) => {
    try {
      const data = insertPackageSchema.parse(req.body);
      const activeEnv = await storage.getActiveVirtualEnv();
      if (!activeEnv) {
        throw new Error("No active virtual environment");
      }
      
      await installPackage(activeEnv.path, data.name, data.version);
      const pkg = await storage.installPackage(data);
      res.json(pkg);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/modules/:name", async (req, res) => {
    try {
      const attributes = await getModuleAttributes(req.params.name);
      res.json(attributes);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/modules/help/:name", async (req, res) => {
    try {
      const help = await getModuleHelp(req.params.name);
      res.json(help);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { virtualEnvs, packages, type VirtualEnv, type Package, type InsertVirtualEnv, type InsertPackage } from "@shared/schema";

export interface IStorage {
  createVirtualEnv(env: InsertVirtualEnv): Promise<VirtualEnv>;
  getVirtualEnvs(): Promise<VirtualEnv[]>;
  getActiveVirtualEnv(): Promise<VirtualEnv | undefined>;
  setActiveVirtualEnv(id: number): Promise<void>;
  installPackage(pkg: InsertPackage): Promise<Package>;
  getPackages(envId: number): Promise<Package[]>;
}

export class MemStorage implements IStorage {
  private virtualEnvs: Map<number, VirtualEnv>;
  private packages: Map<number, Package>;
  private currentId: number;

  constructor() {
    this.virtualEnvs = new Map();
    this.packages = new Map();
    this.currentId = 1;
  }

  async createVirtualEnv(env: InsertVirtualEnv): Promise<VirtualEnv> {
    const id = this.currentId++;
    // Ensure isActive is set to false by default if not provided
    const virtualEnv: VirtualEnv = { ...env, id, isActive: env.isActive || false };
    this.virtualEnvs.set(id, virtualEnv);
    return virtualEnv;
  }

  async getVirtualEnvs(): Promise<VirtualEnv[]> {
    return Array.from(this.virtualEnvs.values());
  }

  async getActiveVirtualEnv(): Promise<VirtualEnv | undefined> {
    return Array.from(this.virtualEnvs.values()).find((env) => env.isActive);
  }

  async setActiveVirtualEnv(id: number): Promise<void> {
    // Deactivate all environments first
    for (const [envId, env] of this.virtualEnvs.entries()) {
      this.virtualEnvs.set(envId, { ...env, isActive: env.id === id });
    }
  }

  async installPackage(pkg: InsertPackage): Promise<Package> {
    const id = this.currentId++;
    // Ensure required fields are present
    if (!pkg.envId) {
      throw new Error("Environment ID is required");
    }
    const package_: Package = { ...pkg, id };
    this.packages.set(id, package_);
    return package_;
  }

  async getPackages(envId: number): Promise<Package[]> {
    return Array.from(this.packages.values()).filter((pkg) => pkg.envId === envId);
  }
}

export const storage = new MemStorage();
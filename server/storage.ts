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
    const virtualEnv: VirtualEnv = { ...env, id };
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
    for (const env of this.virtualEnvs.values()) {
      env.isActive = env.id === id;
    }
  }

  async installPackage(pkg: InsertPackage): Promise<Package> {
    const id = this.currentId++;
    const package_: Package = { ...pkg, id };
    this.packages.set(id, package_);
    return package_;
  }

  async getPackages(envId: number): Promise<Package[]> {
    return Array.from(this.packages.values()).filter((pkg) => pkg.envId === envId);
  }
}

export const storage = new MemStorage();

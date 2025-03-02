// PythonLibraryExplorer/server/db.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma

// Helper functions for common database operations
export async function createVirtualEnvironment(name: string, path: string) {
  return prisma.virtualEnvironment.create({
    data: { name, path }
  })
}

export async function addPackageToEnvironment(envId: string, name: string, version: string) {
  return prisma.package.create({
    data: {
      name,
      version,
      environment: {
        connect: { id: envId }
      }
    }
  })
}

export async function addModuleToPackage(packageId: string, name: string, docString?: string) {
  return prisma.module.create({
    data: {
      name,
      docString,
      package: {
        connect: { id: packageId }
      }
    }
  })
}

export async function addAttributeToModule(moduleId: string, name: string, type: string, docString?: string) {
  return prisma.moduleAttribute.create({
    data: {
      name,
      type,
      docString,
      module: {
        connect: { id: moduleId }
      }
    }
  })
}

export async function getEnvironmentWithPackages(envId: string) {
  return prisma.virtualEnvironment.findUnique({
    where: { id: envId },
    include: {
      packages: {
        include: {
          modules: {
            include: {
              attributes: true
            }
          }
        }
      }
    }
  })
}

// Cleanup function for application shutdown
export async function disconnect() {
  await prisma.$disconnect()
} 
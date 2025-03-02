-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_packageId_fkey";

-- DropForeignKey
ALTER TABLE "ModuleAttribute" DROP CONSTRAINT "ModuleAttribute_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_envId_fkey";

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_envId_fkey" FOREIGN KEY ("envId") REFERENCES "VirtualEnvironment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleAttribute" ADD CONSTRAINT "ModuleAttribute_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

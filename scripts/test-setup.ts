import prisma, { createVirtualEnvironment, addPackageToEnvironment } from '../server/db';
import { createPythonEnvironment, installPackage, getModuleAttributes } from '../server/pythonUtils';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  try {
    console.log('🚀 Starting test setup...');

    // Create test virtual environment
    const venvPath = path.join(__dirname, '..', 'test-venv');
    const venvName = 'test-environment';
    
    console.log('📦 Creating virtual environment...');
    await createPythonEnvironment(venvPath);
    const venv = await createVirtualEnvironment(venvName, venvPath);
    console.log('✅ Virtual environment created:', venv);

    // Install a test package (requests is a popular one)
    console.log('📥 Installing requests package...');
    await installPackage(venvPath, 'requests', 'latest');
    const pkg = await addPackageToEnvironment(venv.id, 'requests', 'latest');
    console.log('✅ Package installed:', pkg);

    // Get module attributes
    console.log('🔍 Fetching module attributes...');
    const attributes = await getModuleAttributes('requests', venvPath);
    console.log('✅ Found attributes:', attributes.length);

    // Verify database queries
    console.log('🔍 Verifying database records...');
    const storedEnv = await prisma.virtualEnvironment.findUnique({
      where: { id: venv.id },
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
    });

    console.log('📊 Database verification results:');
    console.log('- Environment:', storedEnv?.name);
    console.log('- Packages:', storedEnv?.packages.length);
    if (storedEnv?.packages[0]) {
      console.log('- Modules:', storedEnv.packages[0].modules.length);
      if (storedEnv.packages[0].modules[0]) {
        console.log('- Attributes:', storedEnv.packages[0].modules[0].attributes.length);
      }
    }

    console.log('\n✨ Test setup completed successfully!');
  } catch (error) {
    console.error('❌ Error during test setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }); 
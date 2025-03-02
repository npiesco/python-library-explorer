// PythonLibraryExplorer/server/pythonUtils.ts
import { promisify } from "util";
import { exec } from "child_process";
import type { ModuleAttribute } from "@shared/schema";

const execAsync = promisify(exec);

export async function createPythonEnvironment(path: string): Promise<void> {
  try {
    // Check if Python 3 is available
    await execAsync('python3 --version');
    
    // Create the virtual environment
    await execAsync(`python3 -m venv "${path}"`);
    
    // Upgrade pip to latest version
    await execAsync(`"${path}/bin/pip" install --upgrade pip`);
    
    // Install basic required packages
    await execAsync(`"${path}/bin/pip" install wheel setuptools`);
  } catch (error: any) {
    throw new Error(`Failed to create Python environment: ${error?.message || String(error)}`);
  }
}

export async function installPackage(
  venvPath: string,
  packageName: string,
  version: string,
): Promise<void> {
  try {
    const packageSpec = version === "latest" ? packageName : `${packageName}==${version}`;
    console.log(`Installing package ${packageSpec} in ${venvPath}`);
    
    // First, make sure pip is up to date
    await execAsync(`"${venvPath}/bin/pip" install --upgrade pip`);
    
    // Then install the package
    const { stdout, stderr } = await execAsync(`"${venvPath}/bin/pip" install ${packageSpec}`);
    
    if (stderr) {
      console.warn(`Warning during package installation: ${stderr}`);
    }
    
    console.log(`Package installation output: ${stdout}`);
    
    // Verify the installation
    const { stdout: verifyStdout } = await execAsync(`"${venvPath}/bin/pip" show ${packageName}`);
    if (!verifyStdout.includes(packageName)) {
      throw new Error(`Failed to verify installation of ${packageName}`);
    }
  } catch (error: any) {
    console.error(`Failed to install package: ${error?.message || String(error)}`);
    throw new Error(`Failed to install package: ${error?.message || String(error)}`);
  }
}

export async function getModuleAttributes(moduleName: string, venvPath: string): Promise<ModuleAttribute[]> {
  try {
    const { stdout } = await execAsync(`${venvPath}/bin/python3 -c "
try:
    import ${moduleName}
    attrs = []
    for attr in dir(${moduleName}):
        try:
            kind = type(getattr(${moduleName}, attr)).__name__
            attrs.append({'name': attr, 'type': kind})
        except:
            pass
    import json
    print(json.dumps(attrs))
except ImportError as e:
    print(json.dumps({'error': str(e)}))
except Exception as e:
    print(json.dumps({'error': str(e)}))"
`);

    const result = JSON.parse(stdout);
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error: any) {
    throw new Error(`Failed to get module attributes: ${error?.message || String(error)}`);
  }
}

export async function searchModuleAttributes(moduleName: string, query: string, venvPath: string): Promise<ModuleAttribute[]> {
  const allAttributes = await getModuleAttributes(moduleName, venvPath);
  return allAttributes.filter(attr => 
    attr.name.toLowerCase().includes(query.toLowerCase()) ||
    attr.type.toLowerCase().includes(query.toLowerCase())
  );
}

export async function getModuleHelp(moduleName: string, venvPath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`${venvPath}/bin/python3 -c "
try:
    import ${moduleName}
    import pydoc
    import sys
    import io

    # Capture output in a string buffer
    buffer = io.StringIO()
    sys.stdout = buffer

    # Get the help text
    help_text = pydoc.render_doc(${moduleName}, renderer=pydoc.plaintext)
    
    # Write in chunks to avoid buffer overflow
    chunk_size = 1024 * 1024  # 1MB chunks
    total_size = len(help_text)
    
    # Write the total size first
    print(f'SIZE:{total_size}')
    
    # Write the content in chunks
    for i in range(0, total_size, chunk_size):
        chunk = help_text[i:i + chunk_size]
        print(f'CHUNK:{chunk}')

except ImportError as e:
    print(f'Error: {str(e)}')
except Exception as e:
    print(f'Error: {str(e)}')"
`);

    if (stdout.startsWith('Error:')) {
      throw new Error(stdout.substring(7));
    }

    // Parse the chunked response
    const lines = stdout.split('\n');
    let totalSize = 0;
    let content = '';

    for (const line of lines) {
      if (line.startsWith('SIZE:')) {
        totalSize = parseInt(line.substring(5), 10);
      } else if (line.startsWith('CHUNK:')) {
        content += line.substring(6);
      }
    }

    // Verify we got all the content
    if (content.length !== totalSize) {
      console.warn(`Warning: Content size mismatch. Expected ${totalSize}, got ${content.length}`);
    }

    return content;
  } catch (error: any) {
    throw new Error(`Failed to get module help: ${error?.message || String(error)}`);
  }
}
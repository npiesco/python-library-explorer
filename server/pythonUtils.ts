import { spawn } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";
import type { ModuleAttribute } from "@shared/schema";

const execAsync = promisify(exec);

export async function createPythonEnvironment(path: string): Promise<void> {
  await execAsync(`python3 -m venv ${path}`);
}

export async function installPackage(
  venvPath: string,
  packageName: string,
  version: string,
): Promise<void> {
  const packageSpec = version === "latest" ? packageName : `${packageName}==${version}`;
  await execAsync(`${venvPath}/bin/pip install ${packageSpec}`);
}

export async function getModuleAttributes(moduleName: string): Promise<ModuleAttribute[]> {
  const { stdout } = await execAsync(`
    python3 -c "
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
    "
  `);
  
  return JSON.parse(stdout);
}

export async function getModuleHelp(moduleName: string): Promise<string> {
  const { stdout } = await execAsync(`
    python3 -c "
    import ${moduleName}
    help(${moduleName})
    "
  `);
  
  return stdout;
}

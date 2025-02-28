#!/usr/bin/env python3
import sys
import json
import struct
import venv
import subprocess
import os
from typing import Dict, Any, List

def send_message(message: Dict[str, Any]) -> None:
    """Send a message to the extension."""
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()

def read_message() -> Dict[str, Any]:
    """Read a message from the extension."""
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        return {}
    length = struct.unpack('I', raw_length)[0]
    message = sys.stdin.buffer.read(length).decode('utf-8')
    return json.loads(message)

class ModuleExplorer:
    def __init__(self):
        self.base_path = os.path.expanduser('~/.python_module_explorer')
        self.envs_file = os.path.join(self.base_path, 'environments.json')
        self.ensure_base_path_exists()
        self.virtual_envs = self.load_virtual_envs()

    def ensure_base_path_exists(self):
        """Create base directory if it doesn't exist."""
        if not os.path.exists(self.base_path):
            os.makedirs(self.base_path)
            self.save_virtual_envs([])

    def load_virtual_envs(self) -> List[Dict[str, Any]]:
        """Load virtual environments from the JSON file."""
        if os.path.exists(self.envs_file):
            with open(self.envs_file, 'r') as f:
                return json.load(f)
        return []

    def save_virtual_envs(self, envs: List[Dict[str, Any]]) -> None:
        """Save virtual environments to the JSON file."""
        with open(self.envs_file, 'w') as f:
            json.dump(envs, f, indent=2)

    def create_virtual_env(self, name: str, path: str) -> Dict[str, Any]:
        """Create a new virtual environment."""
        try:
            full_path = os.path.join(self.base_path, path)
            if os.path.exists(full_path):
                return {"success": False, "error": "Environment already exists"}

            venv.create(full_path, with_pip=True)
            env = {
                "id": len(self.virtual_envs) + 1,
                "name": name,
                "path": full_path,
                "isActive": len(self.virtual_envs) == 0,
            }
            self.virtual_envs.append(env)
            self.save_virtual_envs(self.virtual_envs)
            return {"success": True, "data": env}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def list_virtual_envs(self) -> Dict[str, Any]:
        """List all virtual environments."""
        return {"success": True, "data": self.virtual_envs}

    def set_active_virtual_env(self, env_id: int) -> Dict[str, Any]:
        """Set a virtual environment as active."""
        try:
            for env in self.virtual_envs:
                env["isActive"] = env["id"] == env_id
            self.save_virtual_envs(self.virtual_envs)
            return {"success": True, "data": None}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_active_env_path(self) -> str:
        """Get the path of the active virtual environment."""
        active_env = next((env for env in self.virtual_envs if env["isActive"]), None)
        if not active_env:
            raise RuntimeError("No active virtual environment")
        return active_env["path"]

    def pip_install(self, package_name: str, version: str) -> Dict[str, Any]:
        """Install a Python package in the active virtual environment."""
        try:
            env_path = self.get_active_env_path()
            package_spec = f"{package_name}=={version}" if version != "latest" else package_name
            pip_path = os.path.join(env_path, 'bin', 'pip')
            result = subprocess.run(
                [pip_path, 'install', package_spec],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return {"success": True, "data": {"name": package_name, "version": version}}
            return {"success": False, "error": result.stderr}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_module_help(self, module_name: str) -> Dict[str, Any]:
        """Get help text for a Python module."""
        try:
            env_path = self.get_active_env_path()
            python_path = os.path.join(env_path, 'bin', 'python')
            result = subprocess.run(
                [python_path, '-c', f"import {module_name}; help({module_name})"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return {"success": True, "data": result.stdout}
            return {"success": False, "error": result.stderr}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_module_attributes(self, module_name: str) -> Dict[str, Any]:
        """Get list of attributes for a Python module."""
        try:
            env_path = self.get_active_env_path()
            python_path = os.path.join(env_path, 'bin', 'python')
            result = subprocess.run(
                [python_path, '-c', f"""
import {module_name}
attrs = []
for attr in dir({module_name}):
    try:
        kind = type(getattr({module_name}, attr)).__name__
        attrs.append({{'name': attr, 'type': kind}})
    except:
        pass
import json
print(json.dumps(attrs))
                """],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return {"success": True, "data": json.loads(result.stdout)}
            return {"success": False, "error": result.stderr}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def search_module_attributes(self, module_name: str, query: str) -> Dict[str, Any]:
        """Search for attributes in a module matching the query."""
        try:
            env_path = self.get_active_env_path()
            python_path = os.path.join(env_path, 'bin', 'python')
            result = subprocess.run(
                [python_path, '-c', f"""
import {module_name}
query = "{query}".lower()
attrs = []
for attr in dir({module_name}):
    if query in attr.lower():
        try:
            kind = type(getattr({module_name}, attr)).__name__
            attrs.append({{'name': attr, 'type': kind}})
        except:
            pass
import json
print(json.dumps(attrs))
                """],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return {"success": True, "data": json.loads(result.stdout)}
            return {"success": False, "error": result.stderr}
        except Exception as e:
            return {"success": False, "error": str(e)}

def main():
    explorer = ModuleExplorer()

    while True:
        message = read_message()
        if not message:
            break

        response = {"type": f"{message['type']}_RESULT", "success": False, "error": "Unknown command"}

        if message["type"] == "CREATE_VENV":
            result = explorer.create_virtual_env(message["name"], message["path"])
            response.update(result)
        elif message["type"] == "LIST_VIRTUAL_ENVS":
            result = explorer.list_virtual_envs()
            response.update(result)
        elif message["type"] == "SET_ACTIVE_VIRTUAL_ENV":
            result = explorer.set_active_virtual_env(message["id"])
            response.update(result)
        elif message["type"] == "INSTALL_PACKAGE":
            result = explorer.pip_install(message["packageName"], message["version"])
            response.update(result)
        elif message["type"] == "GET_MODULE_HELP":
            result = explorer.get_module_help(message["moduleName"])
            response.update(result)
        elif message["type"] == "GET_MODULE_ATTRIBUTES":
            result = explorer.get_module_attributes(message["moduleName"])
            response.update(result)
        elif message["type"] == "SEARCH_MODULE_ATTRIBUTES":
            result = explorer.search_module_attributes(message["moduleName"], message["query"])
            response.update(result)

        send_message(response)

if __name__ == "__main__":
    main()
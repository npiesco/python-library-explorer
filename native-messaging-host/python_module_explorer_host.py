#!/usr/bin/env python3
import sys
import json
import struct
import venv
import subprocess
import os
from typing import Dict, Any

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
        self.venv_path = os.path.expanduser('~/.python_module_explorer/venv')
        self.ensure_venv_exists()

    def ensure_venv_exists(self):
        """Create virtual environment if it doesn't exist."""
        if not os.path.exists(self.venv_path):
            venv.create(self.venv_path, with_pip=True)

    def pip_install(self, package_name: str, version: str) -> Dict[str, Any]:
        """Install a Python package in the virtual environment."""
        try:
            package_spec = f"{package_name}=={version}" if version != "latest" else package_name
            pip_path = os.path.join(self.venv_path, 'bin', 'pip')
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
            python_path = os.path.join(self.venv_path, 'bin', 'python')
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

def main():
    explorer = ModuleExplorer()
    
    while True:
        message = read_message()
        if not message:
            break

        response = {"type": f"{message['type']}_RESULT", "success": False, "error": "Unknown command"}
        
        if message["type"] == "INSTALL_PACKAGE":
            result = explorer.pip_install(message["packageName"], message["version"])
            response.update(result)
        elif message["type"] == "GET_MODULE_HELP":
            result = explorer.get_module_help(message["moduleName"])
            response.update(result)
        
        send_message(response)

if __name__ == "__main__":
    main()

# Python Module Explorer - Chrome Extension

## Installation Instructions

1. Build the extension:
   ```bash
   npm run build
   ```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `dist/public` directory from this project

3. Install the native messaging host:
   - Copy `native-messaging-host/com.python.module.explorer.json` to:
     - Linux: `~/.config/google-chrome/NativeMessagingHosts/`
     - MacOS: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`
     - Windows: Registry location specified in Google's documentation
   - Update the path in the JSON file to point to your `python_module_explorer_host.py` location
   - Make `python_module_explorer_host.py` executable: `chmod +x python_module_explorer_host.py`

4. Usage:
   - Click the extension icon in Chrome's toolbar
   - Create a virtual environment
   - Install Python packages
   - Explore module documentation and attributes

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Load the unpacked extension from the `dist/public` directory

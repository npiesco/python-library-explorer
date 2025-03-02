// /PythonLibraryExplorer/server/test-server.ts
import express from 'express';
import cors from 'cors';
import { installPackage } from './pythonUtils';
import { log } from './vite';

const app = express();
app.use(express.json());
app.use(cors());

// Test endpoint
app.post('/api/packages/install', async (req, res) => {
    try {
        const { name, version = 'latest' } = req.body;
        log(`Test server: Installing package ${name} version ${version}`);

        // Hardcode the venv path for testing
        const venvPath = './venv';
        
        await installPackage(venvPath, name, version);
        
        log('Package installed successfully');
        res.json({ success: true, message: `Package ${name} installed successfully` });
    } catch (error: any) {
        log(`Error installing package: ${error}`);
        res.status(400).json({ error: error.message });
    }
});

const port = 5000;
app.listen(port, () => {
    log(`Test server running on http://localhost:${port}`);
}); 
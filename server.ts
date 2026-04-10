import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn, ChildProcess, exec } from 'child_process';
import path from 'path';
import util from 'util';
import { appsConfig, AppConfig } from './apps.config';

const execAsync = util.promisify(exec);

const app = express();
const PORT = 3000;

app.use(express.json());

// Store running processes
const processes: Record<string, ChildProcess> = {};
const logs: Record<string, string[]> = {};

// Initialize logs array for each app
appsConfig.forEach(config => {
  logs[config.id] = [];
});

// Helper to check if a docker container is running
async function isDockerContainerRunning(containerName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`docker inspect -f '{{.State.Running}}' ${containerName}`);
    return stdout.trim() === 'true';
  } catch (e) {
    return false;
  }
}

async function startApp(config: AppConfig) {
  let isRunning = !!processes[config.id];
  if (config.type === 'docker' && !isRunning) {
    isRunning = await isDockerContainerRunning(config.id);
  }

  if (isRunning) {
    console.log(`[${config.name}] is already running.`);
    return;
  }

  console.log(`[${config.name}] Auto-starting...`);
  try {
    const child = spawn(config.command, [], {
      cwd: config.cwd,
      shell: true,
    });

    processes[config.id] = child;
    logs[config.id] = [`Started ${config.name} at ${new Date().toISOString()}`];

    child.stdout?.on('data', (data) => {
      const msg = data.toString();
      logs[config.id].push(msg);
      if (logs[config.id].length > 100) logs[config.id].shift();
      console.log(`[${config.name}] ${msg.trim()}`);
    });

    child.stderr?.on('data', (data) => {
      const msg = data.toString();
      logs[config.id].push(`ERROR: ${msg}`);
      if (logs[config.id].length > 100) logs[config.id].shift();
      console.error(`[${config.name} ERROR] ${msg.trim()}`);
    });

    child.on('close', (code) => {
      logs[config.id].push(`Process exited with code ${code}`);
      console.log(`[${config.name}] exited with code ${code}`);
      delete processes[config.id];
    });

    child.on('error', (err) => {
      logs[config.id].push(`Failed to start process: ${err.message}`);
      console.error(`[${config.name} ERROR] Failed to start:`, err);
      delete processes[config.id];
    });
  } catch (error: any) {
    console.error(`[${config.name} ERROR] Exception during start:`, error);
  }
}

// Auto-start all apps on server boot
appsConfig.forEach(config => startApp(config));

// API Routes
app.get('/api/apps', async (req, res) => {
  const statusList = await Promise.all(appsConfig.map(async config => {
    let isRunning = !!processes[config.id];
    
    // For docker apps, if the spawn process died (e.g. detached mode), check actual container status
    if (config.type === 'docker' && !isRunning) {
      isRunning = await isDockerContainerRunning(config.id);
    }

    return {
      ...config,
      status: isRunning ? 'running' : 'stopped'
    };
  }));
  res.json(statusList);
});

app.post('/api/apps/:id/start', async (req, res) => {
  const { id } = req.params;
  const config = appsConfig.find(c => c.id === id);
  
  if (!config) {
    return res.status(404).json({ error: 'App not found' });
  }
  
  let isRunning = !!processes[id];
  if (config.type === 'docker' && !isRunning) {
    isRunning = await isDockerContainerRunning(config.id);
  }

  if (isRunning) {
    return res.status(400).json({ error: 'App is already running' });
  }

  try {
    await startApp(config);
    res.json({ message: 'Started successfully', status: 'running' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/apps/:id/stop', async (req, res) => {
  const { id } = req.params;
  const config = appsConfig.find(c => c.id === id);
  
  if (!config) {
    return res.status(404).json({ error: 'App not found' });
  }

  let stoppedSomething = false;

  // For docker, explicitly stop/remove the container
  if (config.type === 'docker') {
    try {
      await execAsync(`docker rm -f ${config.id}`);
      stoppedSomething = true;
      logs[id]?.push(`Docker container ${config.id} forcefully removed.`);
    } catch (e) {
      console.error(`Failed to stop docker container ${config.id}:`, e);
    }
  }

  const child = processes[id];
  if (child) {
    child.kill('SIGINT');
    delete processes[id];
    stoppedSomething = true;
  }
  
  if (!stoppedSomething) {
    // It might already be stopped, but we'll return success anyway to sync UI
    return res.json({ message: 'App was already stopped', status: 'stopped' });
  }

  res.json({ message: 'Stopped successfully', status: 'stopped' });
});

app.get('/api/apps/:id/logs', (req, res) => {
  const { id } = req.params;
  res.json({ logs: logs[id] || [] });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

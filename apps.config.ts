export interface AppConfig {
  id: string;
  name: string;
  description: string;
  type: 'docker' | 'conda' | 'npm';
  command: string;
  cwd: string;
  port?: number;
}

// IMPORTANT: If you get "command not found: npm" or "command not found: docker",
// you may need to provide the absolute path to the executable.
// You can find the path by running `which npm` or `which docker` in your terminal.
// Example: '/usr/local/bin/npm run dev -- --port 3002' instead of 'npm run dev -- --port 3002'

export const appsConfig: AppConfig[] = [
  {
    id: 'fusiondesign',
    name: 'FusionDesign',
    description: 'Advanced protein fusion and molecular design environment. Provides interactive tools for structural modeling, sequence analysis, and rational design of chimeric proteins.',
    type: 'npm',
    command: 'npm run dev -- --port 3002',
    cwd: '/Users/kevin/fusiondesign',
    port: 3002,
  },
  {
    id: 'gramm_web',
    name: 'GRAMM Dock',
    description: 'Global Range Molecular Matching (GRAMM) docking simulation platform. High-resolution protein-protein docking, structural prediction, and complex generation.',
    type: 'docker',
    command: 'docker rm -f gramm-app || true; docker run --name gramm-app --rm -p 3001:3000 -v "$(pwd):/app" -w /app gramm-env:latest npm run dev',
    cwd: '/Users/kevin/gramm_web', // Please verify this path
    port: 3001,
  },
  {
    id: 'receptorligandanalyzer',
    name: 'Binding Analyzer',
    description: 'Comprehensive receptor-ligand interaction analysis tool. Visualize binding affinities, molecular dynamics trajectories, and interaction interfaces in 3D.',
    type: 'npm',
    command: 'npm run dev -- --port 3003',
    cwd: '/Users/kevin/receptorligandanalyzer',
    port: 3003,
  },
  {
    id: 'grotop-modify',
    name: 'GroTop Modify',
    description: 'Topology modification and structural optimization tool for GroTop. Advanced environment for molecular topology adjustments.',
    type: 'conda',
    command: 'conda run -n grotop npm run dev -- --port 3004',
    cwd: '/Users/kevin/grotop',
    port: 3004,
  }
];

// Static class names per resource so Tailwind can find them at build time
// (classes built from template strings are not generated).
export type Metric = 'cpu' | 'memory' | 'disk' | 'net-in' | 'net-out' | 'uptime';

export const metricChip: Record<Metric, string> = {
    cpu: 'bg-metric-cpu/10 text-metric-cpu',
    memory: 'bg-metric-memory/10 text-metric-memory',
    disk: 'bg-metric-disk/10 text-metric-disk',
    'net-in': 'bg-metric-net-in/10 text-metric-net-in',
    'net-out': 'bg-metric-net-out/10 text-metric-net-out',
    uptime: 'bg-metric-uptime/10 text-metric-uptime',
};

export const metricBar: Record<Metric, string> = {
    cpu: 'bg-metric-cpu',
    memory: 'bg-metric-memory',
    disk: 'bg-metric-disk',
    'net-in': 'bg-metric-net-in',
    'net-out': 'bg-metric-net-out',
    uptime: 'bg-metric-uptime',
};

// CSS variable names (see assets/tailwind.css), for canvas based charts.
export const metricToken: Record<Metric, string> = {
    cpu: 'c-cpu',
    memory: 'c-memory',
    disk: 'c-disk',
    'net-in': 'c-net-in',
    'net-out': 'c-net-out',
    uptime: 'c-uptime',
};

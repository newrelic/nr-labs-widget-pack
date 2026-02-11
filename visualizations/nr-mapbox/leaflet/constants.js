export const DEFAULT_ZOOM = 1; // default zoom level
export const DEFAULT_CENTER = [39.8283, -98.5795]; // default map center - United States
export const DEFAULT_DISABLE_CLUSTER_ZOOM = 7; // default zoom level to disable clustering
export const HIGH_DENSITY_THRESHOLD = 1000; // auto-enable HD mode above this count
export const DEFAULT_HD_RADIUS = 6; // default circle radius for high density mode

export const COLORS = {
  NONE: {
    color: '#0c74df',
    borderColor: '#0c74df70',
    textColor: '#FFF'
  },
  CRITICAL: {
    color: '#DF2E23',
    borderColor: '#DF2E2370',
    textColor: '#fff'
  },
  WARNING: {
    color: '#FFD23D',
    borderColor: '#FFD23D70',
    textColor: '#293238'
  },
  OK: {
    color: '#05865B',
    borderColor: '#05865B70',
    textColor: '#FFF'
  },
  CLUSTER: {
    color: '#757575',
    borderColor: '#75757570',
    textColor: '#fff',
    groupText: '#fff'
  },
  HEATMAP: {
    default: ['#420052', '#6C0485', '#8F18AC', '#FFBE35', '#FFA022'],
    steps: 50
  }
};

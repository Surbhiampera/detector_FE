// API service layer for the Pharmacovigilance Dashboard
const API_BASE = "http://0.0.0.0:8000";

// Debug helper function
export const debugLog = (message, data = null) => {
  console.log(`[NEW SIGNALS DEBUG] ${message}`, data ? data : "");
};

// Generic fetch function with error handling
export const fetchJSON = async (url) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    return null;
  }
};

// Build query string from parameters
export const buildQueryString = (params) => {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.append(k, v);
  });
  return u.toString();
};

// API endpoints
export const api = {
  // KPIs
  getKPIs: (filters = {}) =>
    fetchJSON(`${API_BASE}/api/kpis?${buildQueryString(filters)}`),

  // Events
  getEvents: (filters = {}) =>
    fetchJSON(`${API_BASE}/api/events?${buildQueryString(filters)}`),

  // Heatmap
  getHeatmap: (filters = {}) =>
    fetchJSON(`${API_BASE}/api/heatmap?${buildQueryString(filters)}`),

  // Signals
  getSignals: (filters = {}) =>
    fetchJSON(`${API_BASE}/api/signals?${buildQueryString(filters)}`),

  // NLP insights
  getNLP: (limit = 20) => fetchJSON(`${API_BASE}/api/nlp?limit=${limit}`),

  // Alerts
  getAlerts: (settings = {}) =>
    fetchJSON(`${API_BASE}/api/alerts?${buildQueryString(settings)}`),

  // Event stats
  getEventStats: (event) =>
    fetchJSON(`${API_BASE}/api/event_stats?${buildQueryString({ event })}`),

  // Patient report
  getPatientReport: (patientId, format = "csv") =>
    fetch(
      `${API_BASE}/api/patient/${encodeURIComponent(
        patientId
      )}/report?format=${format}`
    ),

  // Upload CSV
  uploadCSV: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_BASE}/api/upload_csv`, {
      method: "POST",
      body: formData,
    });
  },
};

// Utility functions
export const buildPairKey = (drug, event) => {
  return `${String(drug).toLowerCase().trim()}||${String(event)
    .toLowerCase()
    .trim()}`;
};

export const computeNewPairs = (previousPairsSet, currentEvents) => {
  const currentPairs = new Set();
  const newPairs = [];
  (currentEvents || []).forEach((event) => {
    if (event.drug_name && event.adverse_event) {
      const pairKey = buildPairKey(event.drug_name, event.adverse_event);
      if (!currentPairs.has(pairKey)) currentPairs.add(pairKey);
      if (!previousPairsSet.has(pairKey))
        newPairs.push({
          drug_name: event.drug_name,
          adverse_event: event.adverse_event,
        });
    }
  });
  return { currentPairs, newPairs };
};

// Local storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      debugLog(`Error getting ${key} from localStorage`, e);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      debugLog(`Saved ${key} to localStorage`, value);
    } catch (e) {
      debugLog(`Error saving ${key} to localStorage`, e);
    }
  },

  // Specific storage functions for the app
  getNewSignalsCount: () => storage.get("newSignalsCount", 0),
  setNewSignalsCount: (count) => storage.set("newSignalsCount", count),

  getNewSignalPairs: () => storage.get("newSignalPairs", []),
  setNewSignalPairs: (pairs) => storage.set("newSignalPairs", pairs),

  getBaselinePairs: () => {
    const pairs = storage.get("baselinePairs", []);
    return new Set(pairs);
  },
  setBaselinePairs: (pairs) => storage.set("baselinePairs", Array.from(pairs)),

  getAlertSettings: () =>
    storage.get("alertsSettings", {
      spike_window_days: 7,
      spike_percent: 50,
      risk_threshold: 0.7,
      min_cases: 5,
      min_severity: "low",
    }),
  setAlertSettings: (settings) => storage.set("alertsSettings", settings),
};

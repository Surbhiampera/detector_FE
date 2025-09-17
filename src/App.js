import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import KPIs from "./components/KPIs";
import Explorer from "./components/Explorer";
import Signals from "./components/Signals";
import NLP from "./components/NLP";
import Alerts from "./components/Alerts";
import Modal from "./components/Modal";
import Notification from "./components/Notification";
import { api, storage, debugLog } from "./services/api";

function App() {
  const [filters, setFilters] = useState({
    drug: "",
    event: "",
    sex: "",
    min_age: "",
    max_age: "",
  });

  const [kpiData, setKpiData] = useState(null);
  const [eventsData, setEventsData] = useState([]);
  const [heatmapData, setHeatmapData] = useState(null);
  const [signalsData, setSignalsData] = useState([]);
  const [nlpData, setNlpData] = useState([]);
  const [alertsData, setAlertsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", content: "" });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
  });

  // Expanded states for show more/less functionality
  const [expandedStates, setExpandedStates] = useState({
    explorer: false,
    heatmap: false,
    signals: false,
    alerts: false,
  });

  // Load all data
  const loadData = useCallback(
    async (preserveSignals = false) => {
      setLoading(true);
      try {
        debugLog("Loading all data...");

        const [kpis, events, heatmap, signals, nlp, alerts] = await Promise.all(
          [
            api.getKPIs(filters),
            api.getEvents({ ...filters, limit: 2000 }),
            api.getHeatmap(filters),
            preserveSignals
              ? Promise.resolve(signalsData)
              : api.getSignals(filters),
            api.getNLP(20),
            api.getAlerts(storage.getAlertSettings()),
          ]
        );

        if (kpis) setKpiData(kpis);
        if (events) setEventsData(events.items || []);
        if (heatmap) setHeatmapData(heatmap);
        if (signals) setSignalsData(signals.top_new_signals || []);
        if (nlp) setNlpData(nlp.insights || []);
        if (alerts) setAlertsData(alerts.alerts || []);

        // Cache events for signal calculations
        if (events) {
          window.__latestEvents = events.items || [];
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    },
    [filters, signalsData]
  );

  // Initialize app
  useEffect(() => {
    const init = async () => {
      debugLog("Initializing application...");

      // Initialize baseline if needed
      if (!localStorage.getItem("baselinePairs")) {
        storage.setBaselinePairs([]);
        debugLog("Initialized empty baseline");
      }

      await loadData();
    };

    init();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = async () => {
    await loadData(true); // Preserve signals when applying filters
  };

  // Handle CSV upload
  const handleCSVUpload = async (file) => {
    if (!file) {
      alert("Please choose a CSV file first.");
      return;
    }

    try {
      debugLog("Starting CSV upload process...");

      // Reset expanded states for new upload
      setExpandedStates({
        explorer: false,
        heatmap: false,
        signals: false,
        alerts: false,
      });

      // Capture pre-upload baseline
      const preUploadEvents = window.__latestEvents || [];
      const preUploadPairs = new Set();
      preUploadEvents.forEach((event) => {
        if (event.drug_name && event.adverse_event) {
          const pairKey = api.buildPairKey(
            event.drug_name,
            event.adverse_event
          );
          preUploadPairs.add(pairKey);
        }
      });

      debugLog("Pre-upload baseline captured", {
        preUploadCount: preUploadPairs.size,
      });

      // Upload CSV
      const response = await api.uploadCSV(file);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      debugLog("Upload completed", { rows: data.rows });
      setNotification({
        show: true,
        message: `Upload complete: ${data.rows} rows`,
      });

      // Reload data
      await loadData();

      // Calculate new signals after data reload
      const postUploadEvents = window.__latestEvents || [];
      const postUploadPairs = new Set();
      const newSignalPairs = [];

      postUploadEvents.forEach((event) => {
        if (event.drug_name && event.adverse_event) {
          const pairKey = api.buildPairKey(
            event.drug_name,
            event.adverse_event
          );
          postUploadPairs.add(pairKey);

          if (!preUploadPairs.has(pairKey)) {
            newSignalPairs.push({
              drug_name: event.drug_name,
              adverse_event: event.adverse_event,
              isNewFromUpload: true,
            });
          }
        }
      });

      debugLog("New signals detected from upload", {
        newCount: newSignalPairs.length,
        newPairs: newSignalPairs.slice(0, 5),
      });

      // Persist new signals data
      storage.setNewSignalsCount(newSignalPairs.length);
      storage.setNewSignalPairs(newSignalPairs);

      // Update baseline for next comparison
      storage.setBaselinePairs(postUploadPairs);

      // Show notification for new signals
      if (newSignalPairs.length > 0) {
        setNotification({
          show: true,
          message: `🔔 ${newSignalPairs.length} new signal${
            newSignalPairs.length > 1 ? "s" : ""
          } detected!`,
        });
      }

      debugLog("Upload process completed", {
        newSignalsDetected: newSignalPairs.length,
      });
    } catch (error) {
      debugLog("ERROR during upload", error);
      console.error(error);
      setNotification({ show: true, message: error.message || String(error) });
    }
  };

  // Show modal
  const showModal = (title, content) => {
    setModal({ isOpen: true, title, content });
  };

  // Hide modal
  const hideModal = () => {
    setModal({ isOpen: false, title: "", content: "" });
  };

  // Toggle expanded state
  const toggleExpanded = (section) => {
    setExpandedStates((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="App">
      <Header />
      <main>
        <KPIs data={kpiData} onShowModal={showModal} filters={filters} />

        <Explorer
          data={eventsData}
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onCSVUpload={handleCSVUpload}
          expanded={expandedStates.explorer}
          onToggleExpanded={() => toggleExpanded("explorer")}
          loading={loading}
        />

        <Signals
          data={signalsData}
          heatmapData={heatmapData}
          expanded={expandedStates}
          onToggleExpanded={toggleExpanded}
          filters={filters}
        />

        <NLP data={nlpData} onShowModal={showModal} />

        <Alerts
          data={alertsData}
          expanded={expandedStates.alerts}
          onToggleExpanded={() => toggleExpanded("alerts")}
          filters={filters}
        />
      </main>

      {modal.isOpen && (
        <Modal
          title={modal.title}
          content={modal.content}
          onClose={hideModal}
        />
      )}

      {notification.show && (
        <Notification
          message={notification.message}
          onClose={() => setNotification({ show: false, message: "" })}
        />
      )}
    </div>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import { storage, api } from "../services/api";

const Alerts = ({ data, expanded, onToggleExpanded, filters }) => {
  const [alertSettings, setAlertSettings] = useState(
    storage.getAlertSettings()
  );
  const [clientAlerts, setClientAlerts] = useState([]);

  const defaultShowCount = 10;
  const alertsToShow = expanded ? data : data.slice(0, defaultShowCount);

  // Compute client-side alerts
  useEffect(() => {
    const computeClientSideAlerts = async () => {
      try {
        const events = window.__latestEvents || [];
        const settings = alertSettings;
        const alerts = [];

        // Include alerts for persisted new signals
        const persistedPairs = storage.getNewSignalPairs();
        const riskThreshold = Number(settings.risk_threshold || 0.7);
        const minCases = Number(settings.min_cases || 5);

        // Add alerts for new signals from upload
        persistedPairs.forEach((p) => {
          if (p.isNewFromUpload) {
            alerts.push({
              severity: "high",
              message: `🆕 New signal from upload: ${p.drug_name} x ${p.adverse_event}`,
              type: "new_signal_upload",
            });
          }
        });

        // Regular alerts computation
        const baselinePairs = storage.getBaselinePairs();
        const currentPairs = new Set();
        const pairDetails = new Map();
        const newPairs = [];

        events.forEach((event) => {
          if (event.drug_name && event.adverse_event) {
            const drugName = String(event.drug_name).trim();
            const adverseEvent = String(event.adverse_event).trim();

            if (drugName && adverseEvent) {
              const pairKey = api.buildPairKey(drugName, adverseEvent);
              currentPairs.add(pairKey);

              if (!pairDetails.has(pairKey)) {
                pairDetails.set(pairKey, {
                  drug_name: drugName,
                  adverse_event: adverseEvent,
                  count: 0,
                  maxScore: 0,
                });
              }

              const detail = pairDetails.get(pairKey);
              detail.count++;
              detail.maxScore = Math.max(
                detail.maxScore,
                Number(event.signal_score || 0)
              );
            }
          }
        });

        currentPairs.forEach((pairKey) => {
          if (!baselinePairs.has(pairKey)) {
            const detail = pairDetails.get(pairKey);
            if (detail) {
              newPairs.push(detail);
            }
          }
        });

        newPairs.forEach((p) => {
          if (p.count >= minCases && p.maxScore >= riskThreshold) {
            alerts.push({
              severity: "high",
              message: `🚨 High-risk new pair detected: ${p.drug_name} x ${
                p.adverse_event
              } (${p.count} cases, score ${p.maxScore.toFixed(2)})`,
              type: "high_risk_new_pair",
            });
          }
        });

        // Spike detection
        const spikeWindow = Number(settings.spike_window_days || 7);
        const pctThreshold = Number(settings.spike_percent || 50);
        const now = new Date();
        const start1 = new Date(now.getTime() - spikeWindow * 24 * 3600 * 1000);
        const start2 = new Date(
          now.getTime() - 2 * spikeWindow * 24 * 3600 * 1000
        );

        const byPair = new Map();
        events.forEach((event) => {
          if (event.drug_name && event.adverse_event) {
            const pairKey = api.buildPairKey(
              event.drug_name,
              event.adverse_event
            );
            const d = new Date(event.date_reported || now);
            const s = byPair.get(pairKey) || { recent: 0, prior: 0 };
            if (d >= start1) s.recent += 1;
            else if (d >= start2) s.prior += 1;
            byPair.set(pairKey, s);
          }
        });

        byPair.forEach((v, key) => {
          const { recent, prior } = v;
          if (recent >= minCases && prior > 0) {
            const pct = ((recent - prior) / prior) * 100;
            if (pct >= pctThreshold) {
              const [drug, event] = key.split("||");
              alerts.push({
                severity: "medium",
                message: `📈 Sudden spike detected for ${drug} x ${event}: +${pct.toFixed(
                  0
                )}% (${prior} → ${recent} cases)`,
                type: "sudden_spike",
              });
            }
          }
        });

        const sevRank = { low: 1, medium: 2, high: 3 };
        const minSevRank = sevRank[settings.min_severity || "low"] || 1;
        const filteredAlerts = alerts.filter(
          (a) => (sevRank[a.severity] || 1) >= minSevRank
        );

        setClientAlerts(filteredAlerts);
      } catch (error) {
        console.error("Client-side alerts computation failed:", error);
        setClientAlerts([]);
      }
    };

    computeClientSideAlerts();
  }, [alertSettings, data]);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...alertSettings, [key]: value };
    setAlertSettings(newSettings);
    storage.setAlertSettings(newSettings);
  };

  const saveAlertSettings = async () => {
    storage.setAlertSettings(alertSettings);
    // You might want to reload data here
    alert("Alert settings saved and applied successfully!");
  };

  const allAlerts = [...data, ...clientAlerts];

  return (
    <section className="alerts">
      <h2>Alerts & Notifications</h2>

      <div className="alerts-summary">
        <div className="alert-count">
          <span className="count-label">Alerts:</span>
          <span className="count-value">{allAlerts.length}</span>
        </div>
      </div>

      {/* Alert Settings */}
      <div
        style={{
          background: "#0f172a",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "15px",
          border: "1px solid #1f2937",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#3b82f6" }}>
          Alert Settings
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "10px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#9ca3af",
                marginBottom: "4px",
              }}
            >
              Spike Window (days)
            </label>
            <input
              type="number"
              value={alertSettings.spike_window_days}
              onChange={(e) =>
                handleSettingChange("spike_window_days", Number(e.target.value))
              }
              style={{
                background: "#0b1220",
                border: "1px solid #1f2937",
                color: "#e5e7eb",
                padding: "6px",
                borderRadius: "4px",
                width: "100%",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#9ca3af",
                marginBottom: "4px",
              }}
            >
              Spike Percent
            </label>
            <input
              type="number"
              value={alertSettings.spike_percent}
              onChange={(e) =>
                handleSettingChange("spike_percent", Number(e.target.value))
              }
              style={{
                background: "#0b1220",
                border: "1px solid #1f2937",
                color: "#e5e7eb",
                padding: "6px",
                borderRadius: "4px",
                width: "100%",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#9ca3af",
                marginBottom: "4px",
              }}
            >
              Risk Threshold
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={alertSettings.risk_threshold}
              onChange={(e) =>
                handleSettingChange("risk_threshold", Number(e.target.value))
              }
              style={{
                background: "#0b1220",
                border: "1px solid #1f2937",
                color: "#e5e7eb",
                padding: "6px",
                borderRadius: "4px",
                width: "100%",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#9ca3af",
                marginBottom: "4px",
              }}
            >
              Min Cases
            </label>
            <input
              type="number"
              value={alertSettings.min_cases}
              onChange={(e) =>
                handleSettingChange("min_cases", Number(e.target.value))
              }
              style={{
                background: "#0b1220",
                border: "1px solid #1f2937",
                color: "#e5e7eb",
                padding: "6px",
                borderRadius: "4px",
                width: "100%",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#9ca3af",
                marginBottom: "4px",
              }}
            >
              Min Severity
            </label>
            <select
              value={alertSettings.min_severity}
              onChange={(e) =>
                handleSettingChange("min_severity", e.target.value)
              }
              style={{
                background: "#0b1220",
                border: "1px solid #1f2937",
                color: "#e5e7eb",
                padding: "6px",
                borderRadius: "4px",
                width: "100%",
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <button
          onClick={saveAlertSettings}
          style={{
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            color: "#ffffff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            marginTop: "10px",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Save Settings
        </button>
      </div>

      <ul id="alerts-list">
        {alertsToShow.map((alert, index) => (
          <li
            key={index}
            className={`alert ${alert.severity}`}
            style={{
              padding: "12px 16px",
              margin: "8px 0",
              borderRadius: "8px",
              borderLeft: `4px solid ${
                alert.severity === "high"
                  ? "#ef4444"
                  : alert.severity === "medium"
                  ? "#f59e0b"
                  : "#10b981"
              }`,
              background:
                alert.severity === "high"
                  ? "linear-gradient(135deg, #7f1d1d, #991b1b)"
                  : alert.severity === "medium"
                  ? "linear-gradient(135deg, #78350f, #92400e)"
                  : "linear-gradient(135deg, #064e3b, #065f46)",
              color: "#e2e8f0",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateX(5px)";
              e.target.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateX(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            {alert.message.startsWith("⚠️")
              ? alert.message
              : `⚠️ ${alert.message}`}
          </li>
        ))}
      </ul>

      {allAlerts.length > defaultShowCount && (
        <div className="show-more-less">
          {!expanded ? (
            <button className="show-more-btn" onClick={onToggleExpanded}>
              Show More Alerts ({allAlerts.length - defaultShowCount} more)
            </button>
          ) : (
            <button className="show-less-btn" onClick={onToggleExpanded}>
              Show Less Alerts
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default Alerts;

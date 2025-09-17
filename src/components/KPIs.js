import React from "react";
import { api, storage } from "../services/api";

const KPIs = ({ data, onShowModal, filters }) => {
  if (!data) {
    return (
      <section className="kpis">
        <div className="kpi">
          <div className="kpi-label">Total reports</div>
          <div className="kpi-value">-</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Adverse events flagged</div>
          <div className="kpi-value">-</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">New signals detected</div>
          <div className="kpi-value">-</div>
        </div>
        <div className="kpi kpi-list">
          <div className="kpi-label">Top risk drugs</div>
          <ul></ul>
        </div>
      </section>
    );
  }

  const handleKPIClick = async (type) => {
    switch (type) {
      case "total_reports":
        const reportsData = await api.getEvents({ ...filters, limit: 1000 });
        if (reportsData && reportsData.items) {
          const reportsContent = `
            <div style="margin-bottom: 20px;">
              <strong>Total Reports: ${data.total_reports}</strong>
              <p style="color: #94a3b8; margin-top: 5px;">Complete list of adverse event reports</p>
            </div>
            <div style="max-height: 500px; overflow-y: auto; width: 100%;">
              <table style="width: 100%; border-collapse: collapse; color: #e2e8f0;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #374151, #4b5563); border-bottom: 2px solid #3b82f6; position: sticky; top: 0;">
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Patient ID</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Drug</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Event</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Date</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Score</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportsData.items
                    .slice(0, 100)
                    .map(
                      (item, index) => `
                    <tr style="border-bottom: 1px solid #4b5563; ${
                      index % 2 === 0 ? "background: rgba(55, 65, 81, 0.3)" : ""
                    }">
                      <td style="padding: 10px;">${
                        item.patient_id || "N/A"
                      }</td>
                      <td style="padding: 10px; color: #60a5fa;">${
                        item.drug_name
                      }</td>
                      <td style="padding: 10px; color: #fbbf24;">${
                        item.adverse_event
                      }</td>
                      <td style="padding: 10px;">${item.date_reported}</td>
                      <td style="padding: 10px; color: ${
                        item.signal_score > 0.7
                          ? "#ef4444"
                          : item.signal_score > 0.4
                          ? "#f59e0b"
                          : "#10b981"
                      }; font-weight: bold;">${
                        item.signal_score?.toFixed(2) || "N/A"
                      }</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
              ${
                reportsData.items.length > 100
                  ? '<div style="margin-top: 15px; font-style: italic; color: #94a3b8; text-align: center;">... and more (showing first 100)</div>'
                  : ""
              }
            </div>
          `;
          onShowModal("📊 Total Reports Details", reportsContent);
        }
        break;

      case "flagged_events":
        const eventsData = await api.getEvents({ ...filters, limit: 1000 });
        if (eventsData && eventsData.items) {
          const flaggedItems = eventsData.items.filter(
            (item) => item.signal_score > 0.5
          );
          const eventsContent = `
            <div style="margin-bottom: 20px;">
              <strong>🚨 Adverse Events Flagged: ${data.flagged_events}</strong>
              <p style="color: #94a3b8; margin-top: 5px;">Events with signal scores above threshold (0.5)</p>
            </div>
            <div style="max-height: 500px; overflow-y: auto; width: 100%;">
              <table style="width: 100%; border-collapse: collapse; color: #e2e8f0;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #dc2626, #b91c1c); border-bottom: 2px solid #ef4444; position: sticky; top: 0;">
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Drug</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Adverse Event</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Signal Score</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Outcome</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Patient</th>
                  </tr>
                </thead>
                <tbody>
                  ${flaggedItems
                    .slice(0, 100)
                    .map(
                      (item, index) => `
                    <tr style="border-bottom: 1px solid #4b5563; ${
                      index % 2 === 0 ? "background: rgba(55, 65, 81, 0.3)" : ""
                    }">
                      <td style="padding: 10px; color: #60a5fa;">${
                        item.drug_name
                      }</td>
                      <td style="padding: 10px; color: #fbbf24;">${
                        item.adverse_event
                      }</td>
                      <td style="padding: 10px; color: #ef4444; font-weight: bold; font-size: 14px;">${
                        item.signal_score?.toFixed(3) || "N/A"
                      }</td>
                      <td style="padding: 10px; color: ${
                        item.outcome === "Fatal"
                          ? "#ef4444"
                          : item.outcome === "Recovered"
                          ? "#10b981"
                          : "#f59e0b"
                      };">${item.outcome}</td>
                      <td style="padding: 10px;">${
                        item.patient_id || "N/A"
                      }</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
              ${
                flaggedItems.length === 0
                  ? '<div style="text-align: center; color: #94a3b8; padding: 20px;">No flagged events found</div>'
                  : ""
              }
            </div>
          `;
          onShowModal("🚨 Flagged Events Details", eventsContent);
        }
        break;

      case "new_signals":
        const persistedCount = storage.getNewSignalsCount();
        const persistedPairs = storage.getNewSignalPairs();
        const signalsContent = `
          <div style="margin-bottom: 20px;">
            <strong>🆕 New Signals Detected: ${persistedCount}</strong>
            <p style="color: #94a3b8; margin-top: 5px;">Drug-adverse event pairs detected from latest upload</p>
          </div>
          <div style="max-height: 500px; overflow-y: auto; width: 100%;">
            ${
              persistedPairs.length > 0
                ? `
              <table style="width: 100%; border-collapse: collapse; color: #e2e8f0;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #10b981, #059669); border-bottom: 2px solid #059669; position: sticky; top: 0;">
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Drug Name</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Adverse Event</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Status</th>
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Detection Time</th>
                  </tr>
                </thead>
                <tbody>
                  ${persistedPairs
                    .map(
                      (pair, index) => `
                    <tr style="border-bottom: 1px solid #4b5563; ${
                      index % 2 === 0 ? "background: rgba(55, 65, 81, 0.3)" : ""
                    }">
                      <td style="padding: 10px; color: #60a5fa; font-weight: 500;">${
                        pair.drug_name
                      }</td>
                      <td style="padding: 10px; color: #fbbf24; font-weight: 500;">${
                        pair.adverse_event
                      }</td>
                      <td style="padding: 10px; color: #10b981; font-weight: bold;">${
                        pair.isNewFromUpload
                          ? "🆕 New from Upload"
                          : "🔍 New Signal"
                      }</td>
                      <td style="padding: 10px; color: #94a3b8;">Latest</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            `
                : '<div style="color: #94a3b8; font-style: italic; text-align: center; padding: 40px;">No new signals detected yet<br><small>Upload a CSV file to detect new signals</small></div>'
            }
          </div>
        `;
        onShowModal("🆕 New Signals Details", signalsContent);
        break;

      case "top_risk_drugs":
        const drugsContent = `
          <div style="margin-bottom: 20px;">
            <strong>⚠️ Top Risk Drugs</strong>
            <p style="color: #94a3b8; margin-top: 5px;">Drugs ranked by calculated risk scores</p>
          </div>
          <div style="max-height: 500px; overflow-y: auto; width: 100%;">
            <table style="width: 100%; border-collapse: collapse; color: #e2e8f0;">
              <thead>
                <tr style="background: linear-gradient(135deg, #f59e0b, #d97706); border-bottom: 2px solid #d97706; position: sticky; top: 0;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Rank</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Drug Name</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Risk Score</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Risk Level</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${data.top_risk_drugs
                  .map((drug, index) => {
                    const riskLevel =
                      drug.score > 0.8
                        ? "Critical"
                        : drug.score > 0.6
                        ? "High"
                        : drug.score > 0.4
                        ? "Medium"
                        : "Low";
                    const riskColor =
                      drug.score > 0.8
                        ? "#ef4444"
                        : drug.score > 0.6
                        ? "#f59e0b"
                        : drug.score > 0.4
                        ? "#eab308"
                        : "#10b981";
                    const riskIcon =
                      drug.score > 0.8
                        ? "🚨"
                        : drug.score > 0.6
                        ? "⚠️"
                        : drug.score > 0.4
                        ? "⚡"
                        : "✅";
                    const action =
                      drug.score > 0.8
                        ? "Immediate Review"
                        : drug.score > 0.6
                        ? "Priority Review"
                        : drug.score > 0.4
                        ? "Standard Review"
                        : "Monitor";
                    return `
                    <tr style="border-bottom: 1px solid #4b5563; ${
                      index % 2 === 0 ? "background: rgba(55, 65, 81, 0.3)" : ""
                    }">
                      <td style="padding: 12px; font-weight: bold; color: #3b82f6;">#${
                        index + 1
                      }</td>
                      <td style="padding: 12px; color: #60a5fa; font-weight: 500;">${
                        drug.drug_name
                      }</td>
                      <td style="padding: 12px; font-weight: bold; color: ${riskColor}; font-size: 14px;">${drug.score.toFixed(
                      4
                    )}</td>
                      <td style="padding: 12px; color: ${riskColor}; font-weight: bold;">${riskIcon} ${riskLevel}</td>
                      <td style="padding: 12px; color: ${riskColor}; font-style: italic;">${action}</td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
        onShowModal("⚠️ Top Risk Drugs Details", drugsContent);
        break;

      default:
        break;
    }
  };

  return (
    <section className="kpis">
      <div
        className="kpi"
        onClick={() => handleKPIClick("total_reports")}
        title="Click to view detailed reports"
      >
        <div className="kpi-label">Total reports</div>
        <div className="kpi-value">{data.total_reports}</div>
      </div>

      <div
        className="kpi"
        onClick={() => handleKPIClick("flagged_events")}
        title="Click to view flagged events details"
      >
        <div className="kpi-label">Adverse events flagged</div>
        <div className="kpi-value">{data.flagged_events}</div>
      </div>

      <div
        className="kpi"
        onClick={() => handleKPIClick("new_signals")}
        title="Click to view new signals details"
      >
        <div className="kpi-label">New signals detected</div>
        <div className="kpi-value">{storage.getNewSignalsCount()}</div>
      </div>

      <div
        className="kpi kpi-list"
        onClick={() => handleKPIClick("top_risk_drugs")}
        title="Click to view top risk drugs details"
      >
        <div className="kpi-label">Top risk drugs</div>
        <ul>
          {data.top_risk_drugs.map((drug, index) => (
            <li key={index}>
              {drug.drug_name}: {drug.score.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default KPIs;

import React, { useState, useRef } from "react";
import { api } from "../services/api";

const Explorer = ({
  data,
  filters,
  onFilterChange,
  onApplyFilters,
  onCSVUpload,
  expanded,
  onToggleExpanded,
  loading,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const defaultShowCount = 20;
  const itemsToShow = expanded ? data : data.slice(0, defaultShowCount);

  const handleDownload = async (patientId) => {
    if (!patientId) return;

    try {
      const response = await api.getPatientReport(patientId, "csv");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patient_${patientId}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Download error:", error);
      alert(error.message || String(error));
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onCSVUpload(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <section className="explorer">
      <h2>Adverse Event Explorer</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Drug"
          value={filters.drug}
          onChange={(e) => onFilterChange("drug", e.target.value)}
        />
        <input
          type="text"
          placeholder="Adverse Event"
          value={filters.event}
          onChange={(e) => onFilterChange("event", e.target.value)}
        />
        <select
          value={filters.sex}
          onChange={(e) => onFilterChange("sex", e.target.value)}
        >
          <option value="">Sex</option>
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
        <input
          type="number"
          placeholder="Min age"
          value={filters.min_age}
          onChange={(e) => onFilterChange("min_age", e.target.value)}
        />
        <input
          type="number"
          placeholder="Max age"
          value={filters.max_age}
          onChange={(e) => onFilterChange("max_age", e.target.value)}
        />
        <button id="btn-apply" onClick={onApplyFilters} disabled={loading}>
          {loading ? "Applying..." : "Apply"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <button
          id="btn-upload"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>

      <div className="table-wrapper">
        <table id="events-table">
          <thead>
            <tr>
              <th>Drug</th>
              <th>Indication</th>
              <th>Adverse Event</th>
              <th>Age</th>
              <th>Sex</th>
              <th>Outcome</th>
              <th>Date</th>
              <th>Signal Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {itemsToShow.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: "8px", fontSize: "12px" }}>
                  {item.drug_name}
                </td>
                <td style={{ padding: "8px", fontSize: "12px" }}>
                  {item.indication}
                </td>
                <td style={{ padding: "8px", fontSize: "12px" }}>
                  {item.adverse_event}
                </td>
                <td style={{ padding: "8px", fontSize: "12px" }}>{item.age}</td>
                <td style={{ padding: "8px", fontSize: "12px" }}>{item.sex}</td>
                <td style={{ padding: "8px", fontSize: "12px" }}>
                  {item.outcome}
                </td>
                <td style={{ padding: "8px", fontSize: "12px" }}>
                  {item.date_reported}
                </td>
                <td style={{ padding: "8px", fontSize: "12px" }}>
                  {item.signal_score?.toFixed(1) || "N/A"}
                </td>
                <td style={{ padding: "8px" }}>
                  {item.patient_id !== undefined &&
                    item.patient_id !== null && (
                      <button
                        className="btn-download"
                        onClick={() => handleDownload(item.patient_id)}
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        Download
                      </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > defaultShowCount && (
        <div className="show-more-less">
          {!expanded ? (
            <button className="show-more-btn" onClick={onToggleExpanded}>
              Show More Records ({data.length - defaultShowCount} more)
            </button>
          ) : (
            <button className="show-less-btn" onClick={onToggleExpanded}>
              Show Less Records
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default Explorer;

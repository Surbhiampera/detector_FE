import React from "react";
import { storage } from "../services/api";

const Signals = ({
  data,
  heatmapData,
  expanded,
  onToggleExpanded,
  filters,
}) => {
  const defaultShowCount = 50;
  const cellsToShow = expanded.heatmap
    ? heatmapData?.cells || []
    : (heatmapData?.cells || []).slice(0, defaultShowCount);

  const defaultSignalsCount = 10;
  const signalsToShow = expanded.signals
    ? data
    : data.slice(0, defaultSignalsCount);

  const renderHeatmapCells = () => {
    if (!heatmapData?.cells || heatmapData.cells.length === 0) {
      return (
        <div
          style={{
            color: "#64748b",
            padding: "20px",
            textAlign: "center",
            background: "linear-gradient(135deg, #1e293b, #334155)",
            borderRadius: "8px",
            border: "2px solid #475569",
          }}
        >
          No heatmap data available
        </div>
      );
    }

    const drugs = [...new Set(cellsToShow.map((c) => c.drug_name))];
    const events = [...new Set(cellsToShow.map((c) => c.adverse_event))];

    return (
      <div
        className="grid"
        style={{
          display: "grid",
          gridTemplateColumns: `150px repeat(${Math.min(
            events.length,
            8
          )}, 1fr)`,
          gap: "2px",
          background: "linear-gradient(135deg, #1e293b, #334155)",
          padding: "15px",
          borderRadius: "12px",
          border: "2px solid #3b82f6",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        {/* Corner cell */}
        <div
          style={{
            background: "linear-gradient(135deg, #374151, #4b5563)",
            padding: "8px",
            color: "#e2e8f0",
            fontWeight: "bold",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
          }}
        >
          📊
        </div>

        {/* Event headers */}
        {events.slice(0, 8).map((ev, index) => (
          <div
            key={index}
            style={{
              background: "linear-gradient(135deg, #475569, #64748b)",
              color: "#f1f5f9",
              padding: "6px",
              fontWeight: "bold",
              fontSize: "10px",
              textAlign: "center",
              borderRadius: "6px",
              wordWrap: "break-word",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            title={ev}
            onMouseEnter={(e) => {
              e.target.style.background =
                "linear-gradient(135deg, #3b82f6, #2563eb)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background =
                "linear-gradient(135deg, #475569, #64748b)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            {ev.length > 12 ? ev.substring(0, 12) + "..." : ev}
          </div>
        ))}

        {/* Drug rows */}
        {drugs.map((dr, drugIndex) => (
          <React.Fragment key={drugIndex}>
            {/* Drug header */}
            <div
              style={{
                background: "linear-gradient(135deg, #475569, #64748b)",
                color: "#f1f5f9",
                padding: "6px",
                fontWeight: "bold",
                fontSize: "10px",
                borderRadius: "6px",
                wordWrap: "break-word",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              title={dr}
              onMouseEnter={(e) => {
                e.target.style.background =
                  "linear-gradient(135deg, #3b82f6, #2563eb)";
                e.target.style.transform = "translateX(5px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background =
                  "linear-gradient(135deg, #475569, #64748b)";
                e.target.style.transform = "translateX(0)";
              }}
            >
              {dr.length > 15 ? dr.substring(0, 15) + "..." : dr}
            </div>

            {/* Event cells */}
            {events.slice(0, 8).map((ev, eventIndex) => {
              const match = cellsToShow.find(
                (c) => c.drug_name === dr && c.adverse_event === ev
              );
              const intensity = match ? match.intensity : 0;
              const count = match ? match.count : 0;

              const bgColor =
                intensity > 0.7
                  ? "#dc2626"
                  : intensity > 0.5
                  ? "#ea580c"
                  : intensity > 0.3
                  ? "#d97706"
                  : intensity > 0.1
                  ? "#ca8a04"
                  : "#6b7280";

              return (
                <div
                  key={eventIndex}
                  style={{
                    background: bgColor,
                    color: intensity > 0.1 ? "#ffffff" : "#e5e7eb",
                    padding: "6px",
                    textAlign: "center",
                    fontSize: "10px",
                    fontWeight: "bold",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "30px",
                  }}
                  title={`${dr} x ${ev}: ${count} cases (intensity: ${intensity.toFixed(
                    3
                  )})`}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.1)";
                    e.target.style.boxShadow =
                      "0 8px 25px rgba(239, 68, 68, 0.4)";
                    e.target.style.zIndex = "10";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = "none";
                    e.target.style.zIndex = "1";
                  }}
                >
                  {count}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderSignalsList = () => {
    const persistedPairs = storage.getNewSignalPairs();
    const signalsToDisplay =
      persistedPairs.length > 0 ? persistedPairs : signalsToShow;

    return (
      <ul>
        {signalsToDisplay.map((signal, index) => (
          <li
            key={index}
            style={{
              padding: "12px 16px",
              margin: "6px 0",
              background: signal.isNewFromUpload
                ? "linear-gradient(135deg, #064e3b, #065f46)"
                : "linear-gradient(135deg, #374151, #4b5563)",
              borderRadius: "8px",
              borderLeft: `4px solid ${
                signal.isNewFromUpload ? "#10b981" : "#3b82f6"
              }`,
              color: "#e2e8f0",
              transition: "all 0.3s",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateX(10px)";
              e.target.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateX(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong
                  style={{
                    color: signal.isNewFromUpload ? "#10b981" : "#60a5fa",
                  }}
                >
                  {signal.drug_name}
                </strong>
                {" × "}
                <strong style={{ color: "#fbbf24" }}>
                  {signal.adverse_event}
                </strong>
              </div>
              <div
                style={{
                  background: signal.isNewFromUpload ? "#10b981" : "#3b82f6",
                  color: "#ffffff",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                {signal.isNewFromUpload ? "NEW UPLOAD" : "NEW"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className="signals">
      <h2>Signal Detection View</h2>

      <div className="heatmap" id="heatmap">
        {renderHeatmapCells()}
      </div>

      {(heatmapData?.cells || []).length > defaultShowCount && (
        <div className="show-more-less">
          {!expanded.heatmap ? (
            <button
              className="show-more-btn"
              onClick={() => onToggleExpanded("heatmap")}
            >
              🔍 Show More Detection View (
              {(heatmapData?.cells || []).length - defaultShowCount} more cells)
            </button>
          ) : (
            <button
              className="show-less-btn"
              onClick={() => onToggleExpanded("heatmap")}
            >
              📊 Show Less Detection View
            </button>
          )}
        </div>
      )}

      <div className="top-signals">
        <h3>Top New Signals ({storage.getNewSignalsCount()})</h3>
        {renderSignalsList()}
      </div>

      {data.length > defaultSignalsCount && (
        <div className="show-more-less">
          {!expanded.signals ? (
            <button
              className="show-more-btn"
              onClick={() => onToggleExpanded("signals")}
            >
              🔍 Show More Signals ({data.length - defaultSignalsCount} more)
            </button>
          ) : (
            <button
              className="show-less-btn"
              onClick={() => onToggleExpanded("signals")}
            >
              📊 Show Less Signals
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default Signals;

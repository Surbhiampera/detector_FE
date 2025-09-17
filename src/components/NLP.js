import React, { useState } from "react";
import { api } from "../services/api";

const NLP = ({ data, onShowModal }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);

  const buildHighlightedHTML = (text, spans) => {
    if (!spans || spans.length === 0) return text;

    let html = "";
    let cursor = 0;

    spans.forEach((s) => {
      const pre = text.slice(cursor, s.start);
      const term = text.slice(s.start, s.end);
      html += pre
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      html += `<span class="highlight" data-term="${term}">${term}</span>`;
      cursor = s.end;
    });

    html += text
      .slice(cursor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return html;
  };

  const showEventDetails = async (term) => {
    try {
      const data = await api.getEventStats(term);
      if (!data) return;

      const byDrug = data.by_drug
        .map(
          (d) =>
            `<li style="color: #e2e8f0; padding: 4px 0;">${d.drug_name}: <span style="color: #3b82f6; font-weight: bold;">${d.count}</span></li>`
        )
        .join("\n");

      const cases = data.cases
        .map(
          (c) =>
            `<li style="color: #e2e8f0; padding: 4px 0;"><span style="color: #10b981;">#${c.patient_id}</span> — <span style="color: #60a5fa;">${c.drug_name}</span> — ${c.date_reported}</li>`
        )
        .join("\n");

      const content = `
        <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 15px; border-radius: 8px; margin-top: 10px; border: 1px solid #3b82f6;">
          <div style="color: #3b82f6; font-weight: bold; margin-bottom: 8px;">📋 Event: ${data.event}</div>
          <div style="color: #e2e8f0; margin-bottom: 8px;"><strong>Total cases:</strong> ${data.total} <span style="color: #10b981;">(last 30d: ${data.recent_30d})</span></div>
          <div class="sub" style="margin-top: 15px;"><strong style="color: #f59e0b;">💊 Top drugs</strong><ul style="margin: 8px 0; padding-left: 20px;">${byDrug}</ul></div>
          <div class="sub" style="margin-top: 15px;"><strong style="color: #ef4444;">🏥 Recent cases</strong><ul style="margin: 8px 0; padding-left: 20px;">${cases}</ul></div>
        </div>
      `;

      onShowModal(`Event Details: ${data.event}`, content);
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  };

  const handleHighlightClick = (e) => {
    if (e.target.classList.contains("highlight")) {
      const term = e.target.getAttribute("data-term");
      showEventDetails(term);
    }
  };

  return (
    <section className="nlp">
      <h2>Narrative Notes / NLP Insights</h2>
      <ul id="nlp-list" onClick={handleHighlightClick}>
        {data.map((insight, index) => (
          <li
            key={index}
            style={{
              margin: "12px 0",
              background: "linear-gradient(135deg, #374151, #4b5563)",
              borderRadius: "8px",
              padding: "15px",
              borderLeft: "4px solid #3b82f6",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateX(5px)";
              e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateX(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            <div className="note">
              <div
                className="note-header"
                style={{
                  color: "#60a5fa",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                <strong>👤 {insight.patient_id ?? "Unknown"}</strong>
                <span style={{ color: "#94a3b8" }}>
                  {" "}
                  📅 {insight.date_reported}
                </span>
                {" — "}
                <span style={{ color: "#f59e0b" }}>
                  severity {insight.severity_score}
                </span>
              </div>
              <div
                className="note-body"
                style={{
                  color: "#e2e8f0",
                  lineHeight: "1.4",
                }}
                dangerouslySetInnerHTML={{
                  __html: buildHighlightedHTML(
                    insight.note || "",
                    insight.spans || []
                  ),
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div id="nlp-details" className="nlp-details">
        {eventDetails && (
          <div dangerouslySetInnerHTML={{ __html: eventDetails }} />
        )}
      </div>
    </section>
  );
};

export default NLP;

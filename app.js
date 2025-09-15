// 🌐 Define API base URL once here
const API_BASE = `https://detector-q5gm.onrender.com`;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Debug helper function
function debugLog(message, data = null) {
  console.log(`[NEW SIGNALS DEBUG] ${message}`, data ? data : "");
}

async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    return null;
  }
}

function qs(params) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.append(k, v);
  });
  return u.toString();
}

function currentFilters() {
  return {
    drug: $("#filter-drug")?.value.trim(),
    event: $("#filter-event")?.value.trim(),
    sex: $("#filter-sex")?.value,
    min_age: $("#filter-min-age")?.value,
    max_age: $("#filter-max-age")?.value,
  };
}

// Modal functionality for KPI hover
function createModal() {
  let modal = document.getElementById("kpi-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "kpi-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      z-index: 10000;
      align-items: center;
      justify-content: center;
    `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: linear-gradient(135deg, #1e293b, #334155);
      color: #e2e8f0;
      padding: 30px;
      border-radius: 15px;
      max-width: 95%;
      max-height: 90%;
      width: 100%;
      overflow-y: auto;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
      border: 2px solid #3b82f6;
      position: relative;
    `;

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "✕";
    closeBtn.style.cssText = `
      position: absolute;
      top: 15px;
      right: 20px;
      background: #ef4444;
      border: none;
      font-size: 20px;
      color: #ffffff;
      cursor: pointer;
      font-weight: bold;
      width: 35px;
      height: 35px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    `;
    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.background = "#dc2626";
      closeBtn.style.transform = "scale(1.1)";
    });
    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.background = "#ef4444";
      closeBtn.style.transform = "scale(1)";
    });
    closeBtn.addEventListener("click", hideModal);

    modalContent.appendChild(closeBtn);
    modalContent.innerHTML += '<div id="modal-body"></div>';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) hideModal();
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display === "flex") {
        hideModal();
      }
    });
  }
  return modal;
}

function showModal(title, content) {
  const modal = createModal();
  const modalBody = document.getElementById("modal-body");
  modalBody.innerHTML = `<h3 style="color: #3b82f6; margin-bottom: 20px; font-size: 24px; margin-top: 15px;">${title}</h3>${content}`;
  modal.style.display = "flex";
}

function hideModal() {
  const modal = document.getElementById("kpi-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Get persisted new signals count from localStorage
function getPersistedNewSignalsCount() {
  try {
    const count = localStorage.getItem("newSignalsCount");
    return count ? parseInt(count, 10) : 0;
  } catch (e) {
    debugLog("Error getting persisted new signals count", e);
    return 0;
  }
}

// Save new signals count to localStorage
function setPersistedNewSignalsCount(count) {
  try {
    localStorage.setItem("newSignalsCount", String(count));
    debugLog("Persisted new signals count", { count });
  } catch (e) {
    debugLog("Error persisting new signals count", e);
  }
}

// Enhanced function to update new signals count immediately
function updateNewSignalsDisplay(count) {
  debugLog("Updating new signals display", { count });

  const element = document.getElementById("new-signals");
  if (element) {
    element.textContent = String(count);
    setPersistedNewSignalsCount(count);
    debugLog("New signals count updated successfully", { newValue: count });

    // Show notification if count > 0
    if (count > 0) {
      showNewSignalsNotification(count);
    }

    return true;
  } else {
    debugLog("ERROR: new-signals element not found!");
    return false;
  }
}

// Show notification for new signals
function showNewSignalsNotification(count) {
  let notification = document.getElementById("new-signals-notification");
  if (!notification) {
    notification = document.createElement("div");
    notification.id = "new-signals-notification";
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
      z-index: 1000;
      font-weight: bold;
      display: none;
      border-left: 5px solid #047857;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
  }

  notification.innerHTML = `🔔 ${count} new signal${
    count > 1 ? "s" : ""
  } detected!`;
  notification.style.display = "block";

  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.style.display = "none";
  }, 5000);
}

async function loadKPIs() {
  debugLog("Loading KPIs...");
  const data = await fetchJSON(`${API_BASE}/api/kpis?${qs(currentFilters())}`);
  if (!data) {
    debugLog("No KPI data received");
    return;
  }

  // Update other KPIs
  const totalReports = document.getElementById("total-reports");
  const flaggedEvents = document.getElementById("flagged-events");

  if (totalReports) {
    totalReports.textContent = data.total_reports;
    // Add hover functionality for Total Reports
    const totalReportsContainer = totalReports.closest(".kpi");
    if (totalReportsContainer) {
      totalReportsContainer.style.cursor = "pointer";
      totalReportsContainer.title = "Click to view detailed reports";
      totalReportsContainer.addEventListener("click", async () => {
        const reportsData = await fetchJSON(
          `${API_BASE}/api/events?${qs({ ...currentFilters(), limit: 1000 })}`
        );
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
          showModal("📊 Total Reports Details", reportsContent);
        }
      });
    }
  }

  if (flaggedEvents) {
    flaggedEvents.textContent = data.flagged_events;
    // Add hover functionality for Flagged Events
    const flaggedEventsContainer = flaggedEvents.closest(".kpi");
    if (flaggedEventsContainer) {
      flaggedEventsContainer.style.cursor = "pointer";
      flaggedEventsContainer.title = "Click to view flagged events details";
      flaggedEventsContainer.addEventListener("click", async () => {
        const eventsData = await fetchJSON(
          `${API_BASE}/api/events?${qs({ ...currentFilters(), limit: 1000 })}`
        );
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
          showModal("🚨 Flagged Events Details", eventsContent);
        }
      });
    }
  }

  // Use persisted new signals count instead of computing fresh
  const persistedCount = getPersistedNewSignalsCount();
  debugLog("Using persisted new signals count", { persistedCount });
  updateNewSignalsDisplay(persistedCount);

  // Add hover functionality for New Signals
  const newSignalsElement = document.getElementById("new-signals");
  if (newSignalsElement) {
    const newSignalsContainer = newSignalsElement.closest(".kpi");
    if (newSignalsContainer) {
      newSignalsContainer.style.cursor = "pointer";
      newSignalsContainer.title = "Click to view new signals details";
      newSignalsContainer.addEventListener("click", async () => {
        const persistedPairs = getPersistedNewSignalPairs();
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
        showModal("🆕 New Signals Details", signalsContent);
      });
    }
  }

  const list = $("#top-risk-drugs");
  if (list) {
    list.innerHTML = "";
    data.top_risk_drugs.forEach((d) => {
      const li = document.createElement("li");
      li.textContent = `${d.drug_name}: ${d.score.toFixed(2)}`;
      list.appendChild(li);
    });

    // Add hover functionality for Top Risk Drugs
    const topRiskDrugsContainer = list.closest(".kpi");
    if (topRiskDrugsContainer) {
      topRiskDrugsContainer.style.cursor = "pointer";
      topRiskDrugsContainer.title = "Click to view top risk drugs details";
      topRiskDrugsContainer.addEventListener("click", () => {
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
        showModal("⚠️ Top Risk Drugs Details", drugsContent);
      });
    }
  }
}

// Cache events data for signal calculations without charts
async function cacheEventsData() {
  const events = await fetchJSON(
    `${API_BASE}/api/events?${qs({ ...currentFilters(), limit: 2000 })}`
  );
  if (!events) return;

  // Cache latest events for client-side computations
  window.__latestEvents = events.items || [];
  debugLog("Cached events for computation", {
    eventCount: events.items.length,
  });
}

// Render explorer table with show more/less functionality
function renderExplorerTable(allItems, showAll = false) {
  const tbody = $("#events-table tbody");
  if (!tbody) return;

  const defaultShowCount = 20; // Show first 20 rows by default
  const itemsToShow = showAll ? allItems : allItems.slice(0, defaultShowCount);

  tbody.innerHTML = "";
  itemsToShow.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding: 8px; font-size: 12px;">${r.drug_name}</td>
      <td style="padding: 8px; font-size: 12px;">${r.indication}</td>
      <td style="padding: 8px; font-size: 12px;">${r.adverse_event}</td>
      <td style="padding: 8px; font-size: 12px;">${r.age}</td>
      <td style="padding: 8px; font-size: 12px;">${r.sex}</td>
      <td style="padding: 8px; font-size: 12px;">${r.outcome}</td>
      <td style="padding: 8px; font-size: 12px;">${r.date_reported}</td>
      <td style="padding: 8px; font-size: 12px;">${
        r.signal_score?.toFixed(1) || "N/A"
      }</td>
      <td style="padding: 8px;">
        ${
          r.patient_id !== undefined && r.patient_id !== null
            ? `<button class="btn-download" data-id="${r.patient_id}" style="font-size: 11px; padding: 4px 8px;">Download</button>`
            : ""
        }
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Update show more/less buttons for explorer
  updateExplorerShowMoreLessButtons(allItems.length, showAll, defaultShowCount);

  tbody.addEventListener("click", async (e) => {
    const target = e.target;
    if (target && target.classList.contains("btn-download")) {
      const pid = target.getAttribute("data-id");
      if (!pid) return;
      try {
        const url = `${API_BASE}/api/patient/${encodeURIComponent(
          pid
        )}/report?format=csv`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `patient_${pid}.csv`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(a.href);
        a.remove();
      } catch (err) {
        console.error(err);
        alert(err.message || String(err));
      }
    }
  });
}

// Update show more/less buttons for explorer
function updateExplorerShowMoreLessButtons(
  totalCount,
  isExpanded,
  defaultShowCount
) {
  let buttonsContainer = document.querySelector("#explorer-show-more-less");
  if (!buttonsContainer) {
    buttonsContainer = document.createElement("div");
    buttonsContainer.id = "explorer-show-more-less";
    buttonsContainer.style.cssText = "margin-top: 15px; text-align: center;";

    const explorerContainer =
      document.querySelector("#events-table")?.parentNode;
    if (explorerContainer) {
      explorerContainer.appendChild(buttonsContainer);
    }
  }

  buttonsContainer.innerHTML = "";

  if (totalCount > defaultShowCount) {
    if (!isExpanded) {
      const showMoreBtn = document.createElement("button");
      showMoreBtn.textContent = `Show More Records (${
        totalCount - defaultShowCount
      } more)`;
      showMoreBtn.style.cssText = `
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: #ffffff;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        transition: all 0.3s;
      `;
      showMoreBtn.addEventListener("mouseenter", () => {
        showMoreBtn.style.transform = "translateY(-2px)";
        showMoreBtn.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.4)";
      });
      showMoreBtn.addEventListener("mouseleave", () => {
        showMoreBtn.style.transform = "translateY(0)";
        showMoreBtn.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.3)";
      });
      showMoreBtn.addEventListener("click", () => {
        window.__explorerExpanded = true;
        loadExplorer();
      });
      buttonsContainer.appendChild(showMoreBtn);
    } else {
      const showLessBtn = document.createElement("button");
      showLessBtn.textContent = "Show Less Records";
      showLessBtn.style.cssText = `
        background: linear-gradient(135deg, #6b7280, #4b5563);
        color: #ffffff;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3);
        transition: all 0.3s;
      `;
      showLessBtn.addEventListener("mouseenter", () => {
        showLessBtn.style.transform = "translateY(-2px)";
        showLessBtn.style.boxShadow = "0 8px 25px rgba(107, 114, 128, 0.4)";
      });
      showLessBtn.addEventListener("mouseleave", () => {
        showLessBtn.style.transform = "translateY(0)";
        showLessBtn.style.boxShadow = "0 4px 15px rgba(107, 114, 128, 0.3)";
      });
      showLessBtn.addEventListener("click", () => {
        window.__explorerExpanded = false;
        loadExplorer();
      });
      buttonsContainer.appendChild(showLessBtn);
    }
  }
}

async function loadExplorer() {
  const params = { ...currentFilters(), limit: 100 };
  const data = await fetchJSON(`${API_BASE}/api/events?${qs(params)}`);
  if (!data) return;

  const explorerExpanded = window.__explorerExpanded || false;
  renderExplorerTable(data.items, explorerExpanded);
}

// Render heatmap with show more/less functionality
function renderHeatmapCells(allCells, showAll = false) {
  const container = $("#heatmap");
  if (!container) return;

  container.innerHTML = "";

  const defaultShowCount = 50; // Show first 50 cells by default
  const cellsToShow = showAll ? allCells : allCells.slice(0, defaultShowCount);

  if (cellsToShow.length === 0) {
    container.innerHTML =
      '<div style="color: #64748b; padding: 20px; text-align: center; background: linear-gradient(135deg, #1e293b, #334155); border-radius: 8px; border: 2px solid #475569;">No heatmap data available</div>';
    return;
  }

  const drugs = [...new Set(cellsToShow.map((c) => c.drug_name))];
  const events = [...new Set(cellsToShow.map((c) => c.adverse_event))];

  const grid = document.createElement("div");
  grid.className = "grid";
  grid.style.cssText = `
    display: grid;
    grid-template-columns: 150px repeat(${Math.min(events.length, 8)}, 1fr);
    gap: 2px;
    background: linear-gradient(135deg, #1e293b, #334155);
    padding: 15px;
    border-radius: 12px;
    border: 2px solid #3b82f6;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
  `;

  // Add corner cell
  const cornerCell = document.createElement("div");
  cornerCell.style.cssText = `
    background: linear-gradient(135deg, #374151, #4b5563);
    padding: 8px;
    color: #e2e8f0;
    font-weight: bold;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
  `;
  cornerCell.innerHTML = "📊";
  grid.appendChild(cornerCell);

  // Add event headers
  events.slice(0, 8).forEach((ev) => {
    const d = document.createElement("div");
    d.className = "hdr";
    d.textContent = ev.length > 12 ? ev.substring(0, 12) + "..." : ev;
    d.title = ev;
    d.style.cssText = `
      background: linear-gradient(135deg, #475569, #64748b);
      color: #f1f5f9;
      padding: 6px;
      font-weight: bold;
      font-size: 10px;
      text-align: center;
      border-radius: 6px;
      word-wrap: break-word;
      transition: all 0.2s;
      cursor: pointer;
    `;
    d.addEventListener("mouseenter", () => {
      d.style.background = "linear-gradient(135deg, #3b82f6, #2563eb)";
      d.style.transform = "translateY(-2px)";
    });
    d.addEventListener("mouseleave", () => {
      d.style.background = "linear-gradient(135deg, #475569, #64748b)";
      d.style.transform = "translateY(0)";
    });
    grid.appendChild(d);
  });

  // Add drug rows
  drugs.forEach((dr) => {
    const rowHdr = document.createElement("div");
    rowHdr.className = "hdr";
    rowHdr.textContent = dr.length > 15 ? dr.substring(0, 15) + "..." : dr;
    rowHdr.title = dr;
    rowHdr.style.cssText = `
      background: linear-gradient(135deg, #475569, #64748b);
      color: #f1f5f9;
      padding: 6px;
      font-weight: bold;
      font-size: 10px;
      border-radius: 6px;
      word-wrap: break-word;
      transition: all 0.2s;
      cursor: pointer;
    `;
    rowHdr.addEventListener("mouseenter", () => {
      rowHdr.style.background = "linear-gradient(135deg, #3b82f6, #2563eb)";
      rowHdr.style.transform = "translateX(5px)";
    });
    rowHdr.addEventListener("mouseleave", () => {
      rowHdr.style.background = "linear-gradient(135deg, #475569, #64748b)";
      rowHdr.style.transform = "translateX(0)";
    });
    grid.appendChild(rowHdr);

    events.slice(0, 8).forEach((ev) => {
      const cell = document.createElement("div");
      cell.className = "cell";
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

      cell.style.cssText = `
        background: ${bgColor};
        color: ${intensity > 0.1 ? "#ffffff" : "#e5e7eb"};
        padding: 6px;
        text-align: center;
        font-size: 10px;
        font-weight: bold;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 30px;
      `;
      cell.textContent = count;
      cell.title = `${dr} x ${ev}: ${count} cases (intensity: ${intensity.toFixed(
        3
      )})`;

      // Add hover effect
      cell.addEventListener("mouseenter", () => {
        cell.style.transform = "scale(1.1)";
        cell.style.boxShadow = "0 8px 25px rgba(239, 68, 68, 0.4)";
        cell.style.zIndex = "10";
      });
      cell.addEventListener("mouseleave", () => {
        cell.style.transform = "scale(1)";
        cell.style.boxShadow = "none";
        cell.style.zIndex = "1";
      });

      grid.appendChild(cell);
    });
  });

  container.appendChild(grid);

  // Add show more/less buttons for heatmap
  updateHeatmapShowMoreLessButtons(allCells.length, showAll, defaultShowCount);
}

// Update show more/less buttons for heatmap
function updateHeatmapShowMoreLessButtons(
  totalCount,
  isExpanded,
  defaultShowCount
) {
  let buttonsContainer = document.querySelector("#heatmap-show-more-less");
  if (!buttonsContainer) {
    buttonsContainer = document.createElement("div");
    buttonsContainer.id = "heatmap-show-more-less";
    buttonsContainer.style.cssText = "margin-top: 20px; text-align: center;";

    const heatmapContainer = document.querySelector("#heatmap")?.parentNode;
    if (heatmapContainer) {
      heatmapContainer.appendChild(buttonsContainer);
    }
  }

  buttonsContainer.innerHTML = "";

  if (totalCount > defaultShowCount) {
    if (!isExpanded) {
      const showMoreBtn = document.createElement("button");
      showMoreBtn.textContent = `🔍 Show More Detection View (${
        totalCount - defaultShowCount
      } more cells)`;
      showMoreBtn.style.cssText = `
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: #ffffff;
        border: none;
        padding: 14px 28px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
        transition: all 0.3s;
        position: relative;
        overflow: hidden;
      `;
      showMoreBtn.addEventListener("mouseenter", () => {
        showMoreBtn.style.transform = "translateY(-3px)";
        showMoreBtn.style.boxShadow = "0 12px 35px rgba(59, 130, 246, 0.4)";
      });
      showMoreBtn.addEventListener("mouseleave", () => {
        showMoreBtn.style.transform = "translateY(0)";
        showMoreBtn.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.3)";
      });
      showMoreBtn.addEventListener("click", () => {
        window.__heatmapExpanded = true;
        loadHeatmapAndSignals();
      });
      buttonsContainer.appendChild(showMoreBtn);
    } else {
      const showLessBtn = document.createElement("button");
      showLessBtn.textContent = "📊 Show Less Detection View";
      showLessBtn.style.cssText = `
        background: linear-gradient(135deg, #6b7280, #4b5563);
        color: #ffffff;
        border: none;
        padding: 14px 28px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 6px 20px rgba(107, 114, 128, 0.3);
        transition: all 0.3s;
      `;
      showLessBtn.addEventListener("mouseenter", () => {
        showLessBtn.style.transform = "translateY(-3px)";
        showLessBtn.style.boxShadow = "0 12px 35px rgba(107, 114, 128, 0.4)";
      });
      showLessBtn.addEventListener("mouseleave", () => {
        showLessBtn.style.transform = "translateY(0)";
        showLessBtn.style.boxShadow = "0 6px 20px rgba(107, 114, 128, 0.3)";
      });
      showLessBtn.addEventListener("click", () => {
        window.__heatmapExpanded = false;
        loadHeatmapAndSignals();
      });
      buttonsContainer.appendChild(showLessBtn);
    }
  }
}

async function loadHeatmapAndSignals() {
  const heat = await fetchJSON(
    `${API_BASE}/api/heatmap?${qs(currentFilters())}`
  );
  if (!heat) return;

  const heatmapExpanded = window.__heatmapExpanded || false;
  renderHeatmapCells(heat.cells || [], heatmapExpanded);

  await loadAndDisplaySignals();
}

// Get persisted new signal pairs from localStorage
function getPersistedNewSignalPairs() {
  try {
    const pairs = localStorage.getItem("newSignalPairs");
    return pairs ? JSON.parse(pairs) : [];
  } catch (e) {
    debugLog("Error getting persisted new signal pairs", e);
    return [];
  }
}

// Save new signal pairs to localStorage
function setPersistedNewSignalPairs(pairs) {
  try {
    localStorage.setItem("newSignalPairs", JSON.stringify(pairs));
    debugLog("Persisted new signal pairs", { count: pairs.length });
  } catch (e) {
    debugLog("Error persisting new signal pairs", e);
  }
}

// Render signals list with show more/show less functionality
function renderSignalsList(signalsToDisplay) {
  debugLog("Rendering signals list", { totalSignals: signalsToDisplay.length });

  const ul = $("#top-signals");
  if (!ul) {
    debugLog("Top signals list element not found");
    return;
  }

  const signalsExpanded = window.__signalsExpanded || false;
  const defaultShowCount = 10;

  ul.innerHTML = "";

  const signalsToShow = signalsExpanded
    ? signalsToDisplay
    : signalsToDisplay.slice(0, defaultShowCount);

  signalsToShow.forEach((s, index) => {
    const li = document.createElement("li");
    li.style.cssText = `
      padding: 12px 16px;
      margin: 6px 0;
      background: linear-gradient(135deg, #374151, #4b5563);
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      color: #e2e8f0;
      transition: all 0.3s;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    `;

    if (s.slope !== undefined) {
      const slope = Number(s.slope || 0);
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #60a5fa;">${
              s.drug_name
            }</strong> × <strong style="color: #fbbf24;">${
        s.adverse_event
      }</strong>
          </div>
          <div style="color: #94a3b8; font-size: 12px;">slope: ${slope.toFixed(
            3
          )}</div>
        </div>
      `;
    } else if (s.isNewFromUpload) {
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #10b981;">${s.drug_name}</strong> × <strong style="color: #fbbf24;">${s.adverse_event}</strong>
          </div>
          <div style="background: #10b981; color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">NEW UPLOAD</div>
        </div>
      `;
      li.style.borderLeftColor = "#10b981";
      li.style.background = "linear-gradient(135deg, #064e3b, #065f46)";
    } else {
      li.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #60a5fa;">${s.drug_name}</strong> × <strong style="color: #fbbf24;">${s.adverse_event}</strong>
          </div>
          <div style="background: #3b82f6; color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">NEW</div>
        </div>
      `;
    }

    li.addEventListener("mouseenter", () => {
      li.style.transform = "translateX(10px)";
      li.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.3)";
    });
    li.addEventListener("mouseleave", () => {
      li.style.transform = "translateX(0)";
      li.style.boxShadow = "none";
    });

    ul.appendChild(li);
  });

  updateSignalsShowMoreLessButtons(
    signalsToDisplay.length,
    signalsExpanded,
    defaultShowCount
  );
}

// Update show more/less buttons for signals
function updateSignalsShowMoreLessButtons(
  totalCount,
  isExpanded,
  defaultShowCount
) {
  let buttonsContainer = document.querySelector("#signals-show-more-less");
  if (!buttonsContainer) {
    buttonsContainer = document.createElement("div");
    buttonsContainer.id = "signals-show-more-less";
    buttonsContainer.style.cssText = "margin-top: 20px; text-align: center;";

    const signalsContainer = document.querySelector("#top-signals")?.parentNode;
    if (signalsContainer) {
      signalsContainer.appendChild(buttonsContainer);
    }
  }

  buttonsContainer.innerHTML = "";

  if (totalCount > defaultShowCount) {
    if (!isExpanded) {
      const showMoreBtn = document.createElement("button");
      showMoreBtn.textContent = `🔍 Show More Signals (${
        totalCount - defaultShowCount
      } more)`;
      showMoreBtn.style.cssText = `
        background: linear-gradient(135deg, #10b981, #059669);
        color: #ffffff;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
        transition: all 0.3s;
      `;
      showMoreBtn.addEventListener("mouseenter", () => {
        showMoreBtn.style.transform = "translateY(-3px)";
        showMoreBtn.style.boxShadow = "0 12px 35px rgba(16, 185, 129, 0.4)";
      });
      showMoreBtn.addEventListener("mouseleave", () => {
        showMoreBtn.style.transform = "translateY(0)";
        showMoreBtn.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.3)";
      });
      showMoreBtn.addEventListener("click", () => {
        window.__signalsExpanded = true;
        loadAndDisplaySignals();
      });
      buttonsContainer.appendChild(showMoreBtn);
    } else {
      const showLessBtn = document.createElement("button");
      showLessBtn.textContent = "📊 Show Less Signals";
      showLessBtn.style.cssText = `
        background: linear-gradient(135deg, #6b7280, #4b5563);
        color: #ffffff;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 6px 20px rgba(107, 114, 128, 0.3);
        transition: all 0.3s;
      `;
      showLessBtn.addEventListener("mouseenter", () => {
        showLessBtn.style.transform = "translateY(-3px)";
        showLessBtn.style.boxShadow = "0 12px 35px rgba(107, 114, 128, 0.4)";
      });
      showLessBtn.addEventListener("mouseleave", () => {
        showLessBtn.style.transform = "translateY(0)";
        showLessBtn.style.boxShadow = "0 6px 20px rgba(107, 114, 128, 0.3)";
      });
      showLessBtn.addEventListener("click", () => {
        window.__signalsExpanded = false;
        loadAndDisplaySignals();
      });
      buttonsContainer.appendChild(showLessBtn);
    }
  }
}

async function loadAndDisplaySignals() {
  debugLog("Loading and displaying signals...");

  const sig = await fetchJSON(
    `${API_BASE}/api/signals?${qs(currentFilters())}`
  );

  const persistedCount = getPersistedNewSignalsCount();
  const persistedPairs = getPersistedNewSignalPairs();

  debugLog("Using persisted signals data", {
    persistedCount,
    persistedPairsCount: persistedPairs.length,
  });

  updateNewSignalsDisplay(persistedCount);

  const cntEl = $("#signal-count");
  if (cntEl) {
    cntEl.textContent = String(persistedCount);
  }

  let signalsToDisplay = [];
  if (persistedPairs.length > 0) {
    signalsToDisplay = persistedPairs;
    debugLog("Using persisted signal pairs for display");
  } else if (sig && sig.top_new_signals && Array.isArray(sig.top_new_signals)) {
    signalsToDisplay = sig.top_new_signals;
    debugLog("Using server-provided signals");
  } else {
    const { newPairs } = await getNewPairsForDisplay();
    signalsToDisplay = newPairs;
    debugLog("Using computed signals");
  }

  renderSignalsList(signalsToDisplay);
}

function buildHighlightedHTML(text, spans) {
  if (!spans || spans.length === 0) return text;
  let html = "";
  let cursor = 0;
  spans.forEach((s, idx) => {
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
}

async function showEventDetails(term) {
  try {
    const data = await fetchJSON(
      `${API_BASE}/api/event_stats?${qs({ event: term })}`
    );
    const panel = $("#nlp-details");
    if (!panel || !data) return;

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
    panel.innerHTML = `
      <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 15px; border-radius: 8px; margin-top: 10px; border: 1px solid #3b82f6;">
        <div style="color: #3b82f6; font-weight: bold; margin-bottom: 8px;">📋 Event: ${data.event}</div>
        <div style="color: #e2e8f0; margin-bottom: 8px;"><strong>Total cases:</strong> ${data.total} <span style="color: #10b981;">(last 30d: ${data.recent_30d})</span></div>
        <div class="sub" style="margin-top: 15px;"><strong style="color: #f59e0b;">💊 Top drugs</strong><ul style="margin: 8px 0; padding-left: 20px;">${byDrug}</ul></div>
        <div class="sub" style="margin-top: 15px;"><strong style="color: #ef4444;">🏥 Recent cases</strong><ul style="margin: 8px 0; padding-left: 20px;">${cases}</ul></div>
      </div>
    `;
  } catch (e) {
    console.error(e);
  }
}

async function loadNLP() {
  const data = await fetchJSON(`${API_BASE}/api/nlp?limit=20`);
  if (!data) return;
  const ul = $("#nlp-list");
  if (!ul) return;

  ul.innerHTML = "";
  data.insights.forEach((i) => {
    const li = document.createElement("li");
    li.style.cssText = `
      margin: 12px 0;
      background: linear-gradient(135deg, #374151, #4b5563);
      border-radius: 8px;
      padding: 15px;
      border-left: 4px solid #3b82f6;
      transition: all 0.2s;
    `;
    li.addEventListener("mouseenter", () => {
      li.style.transform = "translateX(5px)";
      li.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.2)";
    });
    li.addEventListener("mouseleave", () => {
      li.style.transform = "translateX(0)";
      li.style.boxShadow = "none";
    });

    const header = `<div class="note-header" style="color: #60a5fa; font-weight: bold; margin-bottom: 8px;"><strong>👤 ${
      i.patient_id ?? "Unknown"
    }</strong> <span style="color: #94a3b8;">📅 ${
      i.date_reported
    }</span> — <span style="color: #f59e0b;">severity ${
      i.severity_score
    }</span></div>`;
    const body = `<div class="note-body" style="color: #e2e8f0; line-height: 1.4;">${buildHighlightedHTML(
      i.note || "",
      i.spans || []
    )}</div>`;
    li.innerHTML = `<div class="note">${header}${body}</div>`;
    ul.appendChild(li);
  });
}

function readAlertSettings() {
  try {
    const raw = localStorage.getItem("alertsSettings");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    spike_window_days: Number($("#alerts-spike-window")?.value) || 7,
    spike_percent: Number($("#alerts-spike-percent")?.value) || 50,
    risk_threshold: Number($("#alerts-risk-threshold")?.value) || 0.7,
    min_cases: Number($("#alerts-min-cases")?.value) || 5,
    min_severity: $("#alerts-min-severity")?.value || "low",
  };
}

function writeAlertSettings(settings) {
  localStorage.setItem("alertsSettings", JSON.stringify(settings));
}

// Core function to compute new signals count based on your CSV data structure
async function computeDynamicNewSignalsCount() {
  debugLog("Computing dynamic new signals count...");

  try {
    const events = window.__latestEvents || [];
    debugLog("Available events", { eventCount: events.length });

    if (events.length === 0) {
      debugLog("No events available, returning 0");
      return 0;
    }

    const baselinePairs = getBaselinePairs();
    debugLog("Baseline pairs loaded", { baselineCount: baselinePairs.size });

    // Extract drug-adverse_event pairs from current events
    const currentPairs = new Set();
    events.forEach((event) => {
      if (event.drug_name && event.adverse_event) {
        const drugName = String(event.drug_name).trim();
        const adverseEvent = String(event.adverse_event).trim();

        if (drugName && adverseEvent) {
          const pairKey = buildPairKey(drugName, adverseEvent);
          currentPairs.add(pairKey);
        }
      }
    });

    debugLog("Current pairs extracted", { currentCount: currentPairs.size });

    // Count new pairs (not in baseline)
    let newSignalsCount = 0;
    currentPairs.forEach((pairKey) => {
      if (!baselinePairs.has(pairKey)) {
        newSignalsCount++;
      }
    });

    debugLog("New signals computation complete", {
      newSignalsCount,
      totalCurrent: currentPairs.size,
      totalBaseline: baselinePairs.size,
    });

    return newSignalsCount;
  } catch (e) {
    debugLog("ERROR in computeDynamicNewSignalsCount", e);
    console.error("Error computing dynamic new signals count:", e);
    return 0;
  }
}

function getBaselinePairs() {
  try {
    const raw = localStorage.getItem("baselinePairs");
    if (raw) {
      const pairs = JSON.parse(raw);
      return new Set(pairs);
    }
  } catch (e) {
    debugLog("ERROR loading baseline pairs", e);
  }
  return new Set();
}

async function getNewPairsForDisplay() {
  const events = window.__latestEvents || [];
  const baselinePairs = getBaselinePairs();

  const currentPairs = new Set();
  const pairDetails = new Map();
  const newPairs = [];

  events.forEach((event) => {
    if (event.drug_name && event.adverse_event) {
      const drugName = String(event.drug_name).trim();
      const adverseEvent = String(event.adverse_event).trim();

      if (drugName && adverseEvent) {
        const pairKey = buildPairKey(drugName, adverseEvent);
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

  newPairs.sort((a, b) => b.maxScore - a.maxScore);
  return { currentPairs, newPairs };
}

async function computeClientSideAlerts() {
  try {
    const events = window.__latestEvents || [];
    const settings = readAlertSettings();
    const alerts = [];

    // Include alerts for persisted new signals
    const persistedPairs = getPersistedNewSignalPairs();
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
    const { newPairs } = await getNewPairsForDisplay();
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

    const spikeWindow = Number(settings.spike_window_days || 7);
    const pctThreshold = Number(settings.spike_percent || 50);
    const now = new Date();
    const start1 = new Date(now.getTime() - spikeWindow * 24 * 3600 * 1000);
    const start2 = new Date(now.getTime() - 2 * spikeWindow * 24 * 3600 * 1000);

    const byPair = new Map();
    events.forEach((event) => {
      if (event.drug_name && event.adverse_event) {
        const pairKey = buildPairKey(event.drug_name, event.adverse_event);
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
    return alerts.filter((a) => (sevRank[a.severity] || 1) >= minSevRank);
  } catch (e) {
    console.error("Client-side alerts computation failed:", e);
    return [];
  }
}

function populateAlertSettingsUI() {
  const s = readAlertSettings();
  const winEl = $("#alerts-spike-window");
  const pctEl = $("#alerts-spike-percent");
  const riskEl = $("#alerts-risk-threshold");
  const minCasesEl = $("#alerts-min-cases");
  const sevEl = $("#alerts-min-severity");
  if (winEl) winEl.value = String(s.spike_window_days);
  if (pctEl) pctEl.value = String(s.spike_percent);
  if (riskEl) riskEl.value = String(s.risk_threshold);
  if (minCasesEl) minCasesEl.value = String(s.min_cases);
  if (sevEl) sevEl.value = s.min_severity;
}

function renderAlertsList() {
  const ul = document.querySelector("#alerts-list");
  const btnMore = document.querySelector("#alerts-show-more");
  const btnLess = document.querySelector("#alerts-show-less");
  const all = window.__allAlerts || [];
  const expanded = Boolean(window.__alertsExpanded);

  if (!ul) return;
  ul.innerHTML = "";

  const toShow = expanded ? all : all.slice(0, 10);
  toShow.forEach((a, index) => {
    const li = document.createElement("li");
    li.className = `alert ${a.severity}`;
    li.style.cssText = `
      padding: 12px 16px;
      margin: 8px 0;
      border-radius: 8px;
      border-left: 4px solid ${
        a.severity === "high"
          ? "#ef4444"
          : a.severity === "medium"
          ? "#f59e0b"
          : "#10b981"
      };
      background: ${
        a.severity === "high"
          ? "linear-gradient(135deg, #7f1d1d, #991b1b)"
          : a.severity === "medium"
          ? "linear-gradient(135deg, #78350f, #92400e)"
          : "linear-gradient(135deg, #064e3b, #065f46)"
      };
      color: #e2e8f0;
      transition: all 0.2s;
      cursor: pointer;
    `;
    li.addEventListener("mouseenter", () => {
      li.style.transform = "translateX(5px)";
      li.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.2)";
    });
    li.addEventListener("mouseleave", () => {
      li.style.transform = "translateX(0)";
      li.style.boxShadow = "none";
    });
    li.textContent = a.message.startsWith("⚠️") ? a.message : `⚠️ ${a.message}`;
    ul.appendChild(li);
  });

  if (btnMore)
    btnMore.style.display =
      all.length > 10 && !expanded ? "inline-block" : "none";
  if (btnLess)
    btnLess.style.display =
      all.length > 10 && expanded ? "inline-block" : "none";
}

function setAlerts(allAlerts) {
  window.__allAlerts = Array.isArray(allAlerts) ? allAlerts : [];
  const cnt = document.querySelector("#total-alerts-count");
  if (cnt) cnt.textContent = String(window.__allAlerts.length);
  renderAlertsList();
}

async function loadAlerts() {
  const settings = readAlertSettings();
  const collected = [];

  try {
    const data = await fetchJSON(`${API_BASE}/api/alerts?${qs(settings)}`);
    if (data && data.alerts) {
      data.alerts.forEach((a) => {
        collected.push({
          severity: a.severity || "low",
          message: a.message || "",
        });
      });
    }
  } catch (e) {
    console.warn("Server alerts not available, using client-side only:", e);
  }

  const clientAlerts = await computeClientSideAlerts();
  const allAlerts = [...collected, ...clientAlerts];
  setAlerts(allAlerts);
}

function wireFilters() {
  const applyBtn = $("#btn-apply");
  if (applyBtn) {
    applyBtn.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Applying...";
      try {
        // Don't refresh new signals count when applying filters
        await Promise.all([
          loadExplorer(),
          loadKPIs(), // This will use persisted count
          cacheEventsData(), // Cache events data without charts
          loadHeatmapAndSignals(), // This will use persisted signals
          loadNLP(),
          loadAlerts(),
        ]);
      } finally {
        btn.disabled = false;
        btn.textContent = orig;
      }
    });
  }

  const uploadBtn = $("#btn-upload");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", async () => {
      const fileInput = $("#file-csv");
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (!file) {
        alert("Please choose a CSV file first.");
        return;
      }

      const fd = new FormData();
      fd.append("file", file);
      const btn = uploadBtn;
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Uploading...";

      try {
        debugLog("Starting CSV upload process...");

        // Reset expanded states for new upload
        window.__signalsExpanded = false;
        window.__heatmapExpanded = false;
        window.__explorerExpanded = false;

        // Capture pre-upload baseline
        const preUploadEvents = window.__latestEvents || [];
        const preUploadPairs = new Set();
        preUploadEvents.forEach((event) => {
          if (event.drug_name && event.adverse_event) {
            const pairKey = buildPairKey(event.drug_name, event.adverse_event);
            preUploadPairs.add(pairKey);
          }
        });

        debugLog("Pre-upload baseline captured", {
          preUploadCount: preUploadPairs.size,
        });

        // Upload CSV
        const res = await fetch(`${API_BASE}/api/upload_csv`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Upload failed");

        debugLog("Upload completed", { rows: data.rows });
        alert(`Upload complete: ${data.rows} rows`);

        // Reload all data
        await Promise.all([
          cacheEventsData(), // Cache events data without charts
          loadExplorer(),
          loadNLP(),
        ]);

        // Calculate new signals immediately after data reload
        const postUploadEvents = window.__latestEvents || [];
        const postUploadPairs = new Set();
        const newSignalPairs = [];

        postUploadEvents.forEach((event) => {
          if (event.drug_name && event.adverse_event) {
            const pairKey = buildPairKey(event.drug_name, event.adverse_event);
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
        setPersistedNewSignalsCount(newSignalPairs.length);
        setPersistedNewSignalPairs(newSignalPairs);

        // Update display immediately
        updateNewSignalsDisplay(newSignalPairs.length);

        const cntEl = $("#signal-count");
        if (cntEl) {
          cntEl.textContent = String(newSignalPairs.length);
        }

        // Update baseline for next comparison
        localStorage.setItem(
          "baselinePairs",
          JSON.stringify(Array.from(postUploadPairs))
        );

        // Load remaining components
        await Promise.all([
          loadHeatmapAndSignals(), // Will use persisted data and render with show more/less
          loadKPIs(), // Will use persisted count
          loadAlerts(), // Will include new signal alerts
        ]);

        debugLog("Upload process completed", {
          newSignalsDetected: newSignalPairs.length,
        });
      } catch (e) {
        debugLog("ERROR during upload", e);
        console.error(e);
        alert(e.message || String(e));
      } finally {
        btn.disabled = false;
        btn.textContent = orig;
        if (fileInput) fileInput.value = "";
      }
    });
  }
}

async function init() {
  debugLog("Initializing application...");

  // Initialize baseline if needed
  if (!localStorage.getItem("baselinePairs")) {
    localStorage.setItem("baselinePairs", JSON.stringify([]));
    debugLog("Initialized empty baseline");
  }

  // Initialize expanded states
  window.__signalsExpanded = false;
  window.__heatmapExpanded = false;
  window.__explorerExpanded = false;

  await cacheEventsData(); // Cache events data without loading charts
  await loadKPIs(); // Will use persisted count
  await loadExplorer();
  await loadHeatmapAndSignals(); // Will use persisted signals with show more/less
  await loadNLP();
  await loadAlerts();
  wireFilters();

  // Wire alerts show more/less (existing functionality)
  window.__alertsExpanded = false;
  const showMoreBtn = document.querySelector("#alerts-show-more");
  const showLessBtn = document.querySelector("#alerts-show-less");

  if (showMoreBtn) {
    showMoreBtn.addEventListener("click", () => {
      window.__alertsExpanded = true;
      renderAlertsList();
    });
  }

  if (showLessBtn) {
    showLessBtn.addEventListener("click", () => {
      window.__alertsExpanded = false;
      renderAlertsList();
    });
  }

  populateAlertSettingsUI();
  const saveAlertsBtn = $("#btn-save-alerts");
  if (saveAlertsBtn) {
    saveAlertsBtn.addEventListener("click", async () => {
      const s = {
        spike_window_days: Number($("#alerts-spike-window")?.value) || 7,
        spike_percent: Number($("#alerts-spike-percent")?.value) || 50,
        risk_threshold: Number($("#alerts-risk-threshold")?.value) || 0.7,
        min_cases: Number($("#alerts-min-cases")?.value) || 5,
        min_severity: $("#alerts-min-severity")?.value || "low",
      };
      writeAlertSettings(s);

      // Don't reset new signals when saving alert settings
      await Promise.all([
        loadKPIs(), // Will use persisted count
        cacheEventsData(), // Cache events data without charts
        loadExplorer(),
        loadHeatmapAndSignals(), // Will use persisted signals
        loadNLP(),
        loadAlerts(),
      ]);

      alert("Alert settings saved and applied successfully!");
    });
  }

  const nlpList = $("#nlp-list");
  if (nlpList) {
    nlpList.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.classList.contains("highlight")) {
        const term = target.getAttribute("data-term");
        showEventDetails(term);
      }
    });
  }

  // Set initial baseline from loaded events
  if (window.__latestEvents && window.__latestEvents.length > 0) {
    const initialPairs = new Set();
    window.__latestEvents.forEach((event) => {
      if (event.drug_name && event.adverse_event) {
        const pairKey = buildPairKey(event.drug_name, event.adverse_event);
        initialPairs.add(pairKey);
      }
    });
    const existing = localStorage.getItem("baselinePairs");
    if (!existing || existing === "[]") {
      localStorage.setItem(
        "baselinePairs",
        JSON.stringify(Array.from(initialPairs))
      );
      debugLog("Set initial baseline", { count: initialPairs.size });
    }
  }

  // Modified periodic refresh - preserve new signals data
  setInterval(() => {
    // Only refresh non-signal related data
    cacheEventsData(); // Cache events data without charts
    loadNLP();
    // Don't refresh KPIs, alerts, or signals to preserve new signal state
  }, 60000);

  debugLog("Application initialization completed");
}

// DOM ready handler
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Utility functions
function buildPairKey(drug, event) {
  return `${String(drug).toLowerCase().trim()}||${String(event)
    .toLowerCase()
    .trim()}`;
}

function computeNewPairs(previousPairsSet, currentEvents) {
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
}

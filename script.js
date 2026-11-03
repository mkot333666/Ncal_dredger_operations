
const $ = (id) => document.getElementById(id);

let currentRecords = [];
let savedReports = [];

try {
    savedReports = JSON.parse(
        localStorage.getItem("dredgerReports") || "[]"
    );

    if (!Array.isArray(savedReports)) savedReports = [];
} catch (error) {
    savedReports = [];
}

// Set today's date
$("reportDate").value = new Date().toISOString().slice(0, 10);

// Convert minutes into hours and minutes
function formatMinutes(minutes) {
    const total = Number(minutes) || 0;
    const hours = Math.floor(total / 60);
    const remaining = total % 60;

    return `${hours} hours ${remaining} minutes`;
}

// Convert time to AM/PM
function formatTime(time) {
    if (!time) return "NIL";

    const [hours, minutes] = time.split(":").map(Number);

    const period = hours >= 12 ? "PM" : "AM";
    const normalHour = hours % 12 || 12;

    return `${normalHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

// Calculate diesel quantity used
function calculateDiesel() {
    const opening = Number($("opening").value) || 0;
    const received = Number($("received").value) || 0;
    const closing = Number($("closing").value) || 0;

    const used = opening + received - closing;

    $("dieselUsed").textContent =
        `${used.toLocaleString()} litres`;

    $("dieselUsed").style.color =
        used < 0 ? "#b00020" : "#123e69";
}

["opening", "received", "closing"].forEach(id => {
    $(id).addEventListener("input", calculateDiesel);
});

// Add dredger record
function addDredger() {
    const date = $("reportDate").value;
    const dredger = $("dredger").value;

    const day = $("day").value.trim();
    const location = $("location").value.trim();
    const site = $("site").value.trim();
    const road = $("road").value.trim();
    const dumpStatus = $("dumpStatus").value.trim() || "NIL";

    if (!date) {
        alert("Please select the report date.");
        return;
    }

    if (!dredger) {
        alert("Please select a dredger.");
        return;
    }

    if (!day || !location || !site || !road) {
        alert("Complete the day, location, site and road for this dredger.");
        return;
    }

    if (currentRecords.some(r => r.dredger === dredger)) {
        alert("This dredger has already been added to this report.");
        return;
    }

    const opening = Number($("opening").value) || 0;
    const received = Number($("received").value) || 0;
    const closing = Number($("closing").value) || 0;

    const production = Number($("production").value) || 0;
    const downtime = Number($("downtime").value) || 0;

    if ([opening, received, closing, production, downtime]
        .some(value => !Number.isFinite(value) || value < 0)) {
        alert("Enter valid non-negative numbers.");
        return;
    }

    const dieselUsed = opening + received - closing;

    if (dieselUsed < 0) {
        alert("Closing stock cannot exceed opening stock plus quantity received.");
        return;
    }

    const record = {
        date,
        day,
        location,
        site,
        road,
        dumpStatus,
        dredger,
        opening,
        received,
        closing,
        dieselUsed,
        startTime: $("startTime").value,
        stopTime: $("stopTime").value,
        production,
        downtime,
        crew: $("crew").value.trim() || "NIL",
        reasons: $("reasons").value.trim() || "NIL"
    };

    currentRecords.push(record);

    updateRecordList();

    alert(`${dredger} record added successfully.`);

    // Clear the dredger-specific fields
    [
        "dredger",
        "day",
        "location",
        "site",
        "road",
        "dumpStatus",
        "opening",
        "received",
        "closing",
        "startTime",
        "stopTime",
        "production",
        "downtime",
        "crew",
        "reasons"
    ].forEach(id => $(id).value = "");

    calculateDiesel();
}

// Display records
function updateRecordList() {
    $("recordCount").textContent =
        `${currentRecords.length} dredger record(s) entered.`;

    $("recordList").innerHTML = "";

    currentRecords.forEach(record => {
        const div = document.createElement("div");
        div.className = "record";

        const heading = document.createElement("strong");
        heading.textContent = record.dredger;

        const details = document.createElement("p");

        details.textContent =
            `Day: ${record.day} | Location: ${record.location} | ` +
            `Site: ${record.site} | Road: ${record.road} | ` +
            `Dump Status: ${record.dumpStatus || "NIL"} | ` +
            `Quantity used: ${record.dieselUsed} litres | ` +
            `Production: ${formatMinutes(record.production)} | ` +
            `Downtime: ${formatMinutes(record.downtime)}`;

        div.append(heading, details);
        $("recordList").appendChild(div);
    });
}

// CSV formatting
function csvEscape(value) {
    const text = String(value ?? "");
    return '"' + text.replace(/"/g, '""') + '"';
}

// Download file
function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Printable PDF report
function makePrintableReport(report) {
    const recordsHTML = report.records.map(record => `
        <section class="dredger">
            <h2>${escapeHTML(record.dredger)}</h2>

            <table>
                <tr><th>Day</th><td>${escapeHTML(record.day)}</td></tr>
                <tr><th>Location</th><td>${escapeHTML(record.location)}</td></tr>
                <tr><th>Site</th><td>${escapeHTML(record.site)}</td></tr>
                <tr><th>Road</th><td>${escapeHTML(record.road)}</td></tr>
                <tr><th>Dump Status / Site Condition</th><td>${escapeHTML(record.dumpStatus || "NIL")}</td></tr>
                <tr><th>Opening Stock</th><td>${record.opening} litres</td></tr>
                <tr><th>Quantity Received</th><td>${record.received} litres</td></tr>
                <tr><th>Closing Stock</th><td>${record.closing} litres</td></tr>
                <tr><th>Quantity Used</th><td>${record.dieselUsed} litres</td></tr>
                <tr><th>Starting Time</th><td>${formatTime(record.startTime)}</td></tr>
                <tr><th>Stopping Time</th><td>${formatTime(record.stopTime)}</td></tr>
                <tr><th>Production</th><td>${formatMinutes(record.production)}</td></tr>
                <tr><th>Downtime</th><td>${formatMinutes(record.downtime)}</td></tr>
                <tr><th>Crew Names</th><td>${escapeHTML(record.crew)}</td></tr>
                <tr><th>Downtime Reasons</th><td>${escapeHTML(record.reasons)}</td></tr>
            </table>
        </section>
    `).join("");

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Dredger Daily Report</title>

        <style>
            body {
                font-family: Arial, sans-serif;
                color: #142e4c;
                padding: 25px;
            }

            h1 {
                text-align: center;
                color: #102b4e;
                font-size: 23px;
                padding-bottom: 12px;
                border-bottom: 3px solid #315f89;
            }

            .report-title {
                text-align: center;
                color: #315f89;
                margin-bottom: 25px;
            }

            .report-date {
                border: 1px solid #b9c9da;
                background: #e6edf5;
                padding: 12px;
                font-weight: bold;
                margin-bottom: 25px;
            }

            h2 {
                background: #102b4e;
                color: white;
                padding: 12px;
                font-size: 17px;
                margin-top: 28px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
            }

            th, td {
                border: 1px solid #b9c9da;
                text-align: left;
                padding: 10px;
                vertical-align: top;
            }

            th {
                width: 38%;
                background: #e6edf5;
                color: #173c63;
            }

            td {
                background: #f8fafc;
            }

            .dredger {
                margin-top: 25px;
                page-break-inside: avoid;
            }

            @media print {
                body {
                    padding: 0;
                }
            }
        </style>
    </head>

    <body>
        <h1>NCSL</h1>
<h2>DREDGER DAILY OPERATIONS REPORT</h2>

        <p class="report-title">
            Daily Dredger Activity Record
        </p>

        <div class="report-date">
            REPORT DATE: ${escapeHTML(report.date)}
        </div>

        ${recordsHTML}
    </body>
    </html>
    `;
}

// HTML protection
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Finish report and save PDF
function finishReport() {
    if (currentRecords.length === 0) {
        alert("No dredger records have been entered.");
        return;
    }

    const report = {
        reportId: Date.now(),
        date: $("reportDate").value,
        records: [...currentRecords]
    };

    savedReports.push(report);

    try {
        localStorage.setItem(
            "dredgerReports",
            JSON.stringify(savedReports)
        );
    } catch (error) {
        savedReports.pop();
        alert("The phone could not save the report. Export or free some storage and try again.");
        return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert("Report saved, but the print window was blocked. Allow pop-ups and try printing again.");
        currentRecords = [];
        updateRecordList();
        return;
    }

    printWindow.document.open();
    printWindow.document.write(makePrintableReport(report));
    printWindow.document.close();

    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
    };

    alert("Report saved. Select Save as PDF in the print options.");

    currentRecords = [];
    updateRecordList();
}

// Download CSV
function downloadCSV() {
    if (savedReports.length === 0) {
        alert("There are no saved records yet.");
        return;
    }

    const columns = [
        "Report Date",
        "Day",
        "Location",
        "Site",
        "Road",
        "Dump Status / Site Condition",
        "Dredger",
        "Opening Stock",
        "Quantity Received",
        "Closing Stock",
        "Quantity Used",
        "Starting Time",
        "Stopping Time",
        "Production Minutes",
        "Production Hours and Minutes",
        "Downtime Minutes",
        "Downtime Hours and Minutes",
        "Crew Names",
        "Downtime Reasons"
    ];

    const rows = [columns];

    savedReports.forEach(report => {
        report.records.forEach(r => {
            rows.push([
                report.date,
                r.day,
                r.location,
                r.site,
                r.road,
                r.dumpStatus || "NIL",
                r.dredger,
                r.opening,
                r.received,
                r.closing,
                r.dieselUsed,
                formatTime(r.startTime),
                formatTime(r.stopTime),
                r.production,
                formatMinutes(r.production),
                r.downtime,
                formatMinutes(r.downtime),
                r.crew,
                r.reasons
            ]);
        });
    });

    const csv = "\uFEFF" + rows.map(row =>
        row.map(csvEscape).join(",")
    ).join("\r\n");

    downloadFile(
        csv,
        "dredger_records.csv",
        "text/csv;charset=utf-8"
    );
}

// Clear saved reports
function clearSavedRecords() {
    if (!confirm("Are you sure you want to permanently delete all saved reports?")) {
        return;
    }

    savedReports = [];
    localStorage.removeItem("dredgerReports");

    alert("Saved reports have been cleared.");
}

// Connect buttons
$("addButton").addEventListener("click", addDredger);
$("finishButton").addEventListener("click", finishReport);
$("csvButton").addEventListener("click", downloadCSV);
$("clearButton").addEventListener("click", clearSavedRecords);

// Initial setup
updateRecordList();
calculateDiesel();

// Register the offline service worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then(() => {
                console.log("NCSL offline support is ready.");
            })
            .catch(error => {
                console.error("Offline setup failed:", error);
            });
    });
}
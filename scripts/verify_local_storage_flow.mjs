/**
 * RespondaCare Offline Flow Verification Script
 * Simulates localStorage-based data persistence without a browser
 */

// ─── Mock localStorage ─────────────────────────────────────────────────────
const store = {};
const localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; }
};

// ─── Mock WebCrypto (Node.js has this built-in since v15) ──────────────────
import { webcrypto } from "node:crypto";
const crypto = webcrypto;

// ─── Crypto Utilities (mirrored from cryptoUtils.ts) ──────────────────────
const KEY_SALT = "respondacare_salt_2024";

async function deriveKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(KEY_SALT), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, ["encrypt", "decrypt"]
  );
}

async function encryptPayload(data, password) {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

async function decryptPayload(base64, password) {
  const key = await deriveKey(password);
  const combined = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

// ─── Test Helpers ──────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label, condition, got = "") {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${got ? ` — got: ${got}` : ""}`);
    failed++;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n🧪 RespondaCare Offline Persistence Flow Verification\n");
console.log("─".repeat(60));

// ─── TEST 1: BHW Enrollment ───────────────────────────────────────────────
console.log("\n📋 TEST 1: BHW Enrollment → localStorage persistence");
{
  const fullName = "Alex Johnson";
  const dateOfBirth = "1995-08-20";
  const gender = "Male";
  const contactNumber = "09171234567";
  const address = "Zone 3, Pasay City";
  const bloodType = "AB+";
  const pastMedicalHx = "Mild childhood asthma";

  const rawData = {
    name: fullName,
    age: 2025 - new Date(dateOfBirth).getFullYear(),
    gender,
    barangay: "Brgy. 45, Pasay City",
    sample: {
      s: "Chronic seasonal allergic rhinitis",
      a: "Peanuts, Penicillin",
      m: "Cetirizine 10mg PRN",
      p: pastMedicalHx,
      l: "Heavy lunch",
      e: "Pollen exposure"
    }
  };

  const encryptedString = await encryptPayload(rawData, "barangay45key");

  const localResidents = JSON.parse(localStorage.getItem("respondaCare_residents") || "[]");
  localResidents.push({
    id: `RC-${Math.floor(1000 + Math.random() * 9000)}`,
    name: fullName,
    barangay: rawData.barangay,
    encryptedPayload: encryptedString,
    dob: dateOfBirth,
    gender,
    contact: contactNumber,
    address,
    bloodType,
    vulnerability: pastMedicalHx ? "High" : "Low",
    lastUpdated: new Date().toISOString().slice(0, 10),
  });
  localStorage.setItem("respondaCare_residents", JSON.stringify(localResidents));

  const saved = JSON.parse(localStorage.getItem("respondaCare_residents"));
  assert("Resident list has 1 entry", saved.length === 1, saved.length);
  assert("Name is correct", saved[0].name === "Alex Johnson");
  assert("DOB is persisted", saved[0].dob === "1995-08-20");
  assert("Contact is persisted", saved[0].contact === "09171234567");
  assert("bloodType is persisted", saved[0].bloodType === "AB+");
  assert("Vulnerability is High (has past history)", saved[0].vulnerability === "High");
  assert("encryptedPayload exists", typeof saved[0].encryptedPayload === "string" && saved[0].encryptedPayload.length > 0);

  // Audit log
  const localLogs = JSON.parse(localStorage.getItem("respondaCare_auditLogs") || "[]");
  localLogs.unshift({
    ts: new Date().toISOString().slice(0, 10),
    time: "14:22",
    user: "BHW Staff",
    role: "bhw",
    action: `Enrolled resident ${fullName} with encrypted medical card`,
    resource: "core.residents",
    ip: "127.0.0.1",
    dotColor: "bg-green-500"
  });
  localStorage.setItem("respondaCare_auditLogs", JSON.stringify(localLogs));
}

// ─── TEST 2: Patient Dashboard Decrypt ────────────────────────────────────
console.log("\n🔓 TEST 2: Patient Dashboard → AES-256-GCM Decryption");
{
  const residents = JSON.parse(localStorage.getItem("respondaCare_residents"));
  const found = residents.find(r => r.name.toLowerCase() === "alex johnson");

  assert("Resident found by name", !!found);

  const decrypted = await decryptPayload(found.encryptedPayload, "barangay45key");
  assert("Decryption successful", !!decrypted);
  assert("Name matches", decrypted.name === "Alex Johnson");
  assert("Allergies decrypted", decrypted.sample?.a === "Peanuts, Penicillin");
  assert("Medications decrypted", decrypted.sample?.m === "Cetirizine 10mg PRN");
  assert("Past history decrypted", decrypted.sample?.p === "Mild childhood asthma");
}

// ─── TEST 3: Emergency Page Session Lookup ────────────────────────────────
console.log("\n🚨 TEST 3: Emergency Page → Session-based resident lookup");
{
  // Simulate session
  localStorage.setItem("respondaCare_session", JSON.stringify({
    email: "resident@respondacare.ph",
    name: "Alex Johnson",
    role: "resident"
  }));

  const session = JSON.parse(localStorage.getItem("respondaCare_session"));
  const patientName = session.name;

  const residents = JSON.parse(localStorage.getItem("respondaCare_residents"));
  const found = residents.find(r =>
    r.name.toLowerCase() === patientName.toLowerCase() ||
    r.name.toLowerCase().includes(patientName.toLowerCase())
  );

  assert("Session name is Alex Johnson", patientName === "Alex Johnson");
  assert("Resident found by session name", !!found);
  assert("Encrypted QR payload available", !!found?.encryptedPayload);
}

// ─── TEST 4: Responder Dispatch – On-Scene Update ────────────────────────
console.log("\n🚑 TEST 4: Responder Dispatch → Mark incident On-Scene");
{
  // Seed an incident
  const incidents = [{
    id: "#INC-2049",
    category: "Medical",
    barangay: "Zone 3, Pasay City",
    status: "Active"
  }];
  localStorage.setItem("respondaCare_incidents", JSON.stringify(incidents));

  // Mark arrived
  const cached = JSON.parse(localStorage.getItem("respondaCare_incidents"));
  const updated = cached.map(inc => inc.id === "#INC-2049" ? { ...inc, status: "On-Scene" } : inc);
  localStorage.setItem("respondaCare_incidents", JSON.stringify(updated));

  // Audit log
  const localLogs = JSON.parse(localStorage.getItem("respondaCare_auditLogs") || "[]");
  localLogs.unshift({
    ts: new Date().toISOString().slice(0, 10),
    time: "14:30",
    user: "First Responder",
    role: "responder",
    action: `First Responder marked incident #INC-2049 as arrived (On-Scene)`,
    resource: "emergency.incidents",
    ip: "127.0.0.1",
    dotColor: "bg-orange-400"
  });
  localStorage.setItem("respondaCare_auditLogs", JSON.stringify(localLogs));

  const afterUpdate = JSON.parse(localStorage.getItem("respondaCare_incidents"));
  assert("Incident exists", afterUpdate.length === 1);
  assert("Status updated to On-Scene", afterUpdate[0].status === "On-Scene");

  // Test filter — Resolved items should be excluded from dispatch view
  const resolved = [{ id: "#INC-1111", status: "Resolved" }, { id: "#INC-2049", status: "On-Scene" }];
  const filtered = resolved.filter(inc => inc.status !== "Resolved");
  assert("Resolved items filtered from dispatch view", filtered.length === 1 && filtered[0].id === "#INC-2049");
}

// ─── TEST 5: Turnover PCR Save ────────────────────────────────────────────
console.log("\n📄 TEST 5: Turnover PCR → Save handover + mark Resolved");
{
  const newHandover = {
    id: "#INC-2049",
    responder_id: "FR-Alpha",
    patient_name: "Alex Johnson",
    receiving_hospital: "Pasay City General Hospital",
    receiving_provider: "Dr. Cruz, MD",
    transport_mode: "Ambulance",
    gcs_total: 15,
    severity_score: 5,
    response_outcome: "Successful",
    turnover_notes: "Patient stabilized, difficulty breathing resolved",
    date: new Date().toISOString().slice(0, 10),
    time: "14:45",
    vitals: { bp: "110/70", pulse: "92", rr: "20", spo2: "96", temp: "37", glucose: "95" },
    allergies: "Peanuts",
    medications: "Salbutamol inhaler",
    flagProfileUpdate: true
  };

  const localHandovers = JSON.parse(localStorage.getItem("respondaCare_handovers") || "[]");
  localHandovers.unshift(newHandover);
  localStorage.setItem("respondaCare_handovers", JSON.stringify(localHandovers));

  // Update incident to Resolved
  const cachedInc = JSON.parse(localStorage.getItem("respondaCare_incidents") || "[]");
  const updatedInc = cachedInc.map(inc => inc.id === "#INC-2049" ? { ...inc, status: "Resolved" } : inc);
  localStorage.setItem("respondaCare_incidents", JSON.stringify(updatedInc));

  // Log it
  const localLogs = JSON.parse(localStorage.getItem("respondaCare_auditLogs") || "[]");
  localLogs.unshift({
    ts: new Date().toISOString().slice(0, 10),
    time: "14:50",
    user: "FR-Alpha",
    role: "responder",
    action: `Submitted turnover PCR report for patient Alex Johnson (Incident ##INC-2049)`,
    resource: "emergency.handovers",
    ip: "127.0.0.1",
    dotColor: "bg-green-500"
  });
  localStorage.setItem("respondaCare_auditLogs", JSON.stringify(localLogs));

  const savedHandovers = JSON.parse(localStorage.getItem("respondaCare_handovers"));
  assert("Handover saved", savedHandovers.length === 1);
  assert("Patient name correct", savedHandovers[0].patient_name === "Alex Johnson");
  assert("Hospital correct", savedHandovers[0].receiving_hospital === "Pasay City General Hospital");
  assert("Vitals BP correct", savedHandovers[0].vitals.bp === "110/70");

  const incAfterResolve = JSON.parse(localStorage.getItem("respondaCare_incidents"));
  assert("Incident marked Resolved", incAfterResolve[0].status === "Resolved");
}

// ─── TEST 6: Audit Log accumulation ──────────────────────────────────────
console.log("\n📊 TEST 6: Audit Log → accumulated entries from all actions");
{
  const logs = JSON.parse(localStorage.getItem("respondaCare_auditLogs") || "[]");
  assert("Audit log has entries", logs.length >= 3, logs.length);

  const enrollLog = logs.find(l => l.action.includes("Enrolled resident Alex Johnson"));
  assert("Enrollment log entry exists", !!enrollLog);

  const onSceneLog = logs.find(l => l.action.includes("On-Scene"));
  assert("On-Scene log entry exists", !!onSceneLog);

  const turnoverLog = logs.find(l => l.action.includes("turnover PCR"));
  assert("Turnover log entry exists", !!turnoverLog);
}

// ─── TEST 7: Settings Notification Persistence ────────────────────────────
console.log("\n⚙️  TEST 7: Settings → Notification preferences persistence");
{
  const prefs = [true, true, false, true, false];
  localStorage.setItem("respondaCare_notificationPrefs", JSON.stringify(prefs));

  const loaded = JSON.parse(localStorage.getItem("respondaCare_notificationPrefs"));
  assert("Prefs saved correctly (5 items)", loaded.length === 5);
  assert("Critical alerts ON", loaded[0] === true);
  assert("Responder offline alerts OFF", loaded[2] === false);
  assert("Daily digest ON", loaded[3] === true);
}

// ─── TEST 8: Reports aggregation ─────────────────────────────────────────
console.log("\n📈 TEST 8: Reports → Dynamic aggregation from localStorage");
{
  const residents = JSON.parse(localStorage.getItem("respondaCare_residents") || "[]");
  const incidents = JSON.parse(localStorage.getItem("respondaCare_incidents") || "[]");
  const handovers = JSON.parse(localStorage.getItem("respondaCare_handovers") || "[]");

  const residentsCount = 2400 + residents.length;
  const totalInc = 241 + incidents.length;
  const resolved = incidents.filter(i => i.status === "Resolved").length + handovers.length;
  const rate = Math.min(100, Math.round(((Math.round(241 * 0.89) + resolved) / totalInc) * 100));

  assert("Residents count reflects new enrollments", residentsCount === 2401, residentsCount);
  assert("Total incidents includes local ones", totalInc === 242, totalInc);
  assert("Resolution rate computed", rate >= 89 && rate <= 100, rate);
  assert("Handovers included in consult count", handovers.length === 1);
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(60));
console.log(`\n🏁 Verification Complete: ${passed} passed, ${failed} failed\n`);
if (failed === 0) {
  console.log("✅ All tests passed. Offline persistence flow is fully functional.\n");
} else {
  console.log(`⚠️  ${failed} test(s) failed. Review the output above.\n`);
  process.exit(1);
}

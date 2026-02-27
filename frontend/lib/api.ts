import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

// ── Discovery ────────────────────────────────────────────────────────────────

export async function discoverPolicies(query: string) {
  const { data } = await API.post("/api/discover", { query });
  return data;
}

export async function comparePolicies(policy_ids: string[]) {
  const { data } = await API.post("/api/compare", { policy_ids });
  return data;
}

// ── Q&A ──────────────────────────────────────────────────────────────────────

export async function listPolicies() {
  const { data } = await API.get("/api/policies");
  return data;
}

export async function uploadPolicy(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await API.post("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function askQuestion(policy_id: string, question: string) {
  const { data } = await API.post("/api/ask", { policy_id, question });
  return data;
}

// ── Claim ────────────────────────────────────────────────────────────────────

export async function claimCheck(policy_id: string, diagnosis: string, treatment_type?: string) {
  const { data } = await API.post("/api/claim-check", {
    policy_id,
    diagnosis,
    treatment_type: treatment_type || "hospitalization",
  });
  return data;
}

export async function extractConditions(text: string) {
  const { data } = await API.post("/api/extract-conditions", { text });
  return data;
}

export async function extractConditionsFromFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await API.post("/api/extract-conditions-file", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function matchConditions(conditions: object[]) {
  const { data } = await API.post("/api/match-conditions", { conditions });
  return data;
}

export async function gapAnalysis(policy_id: string) {
  const { data } = await API.get(`/api/gap-analysis/${policy_id}`);
  return data;
}

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// --- Type Definitions ---
interface Station {
  name: string;
  code: string;
  walking_time: number;
  index: number;
  active: boolean;
}

interface Line {
  name: string;
  line_code: string;
  direction: string;
  stations: Station[];
  travel_time_between_stations: number; // default but we recalc average per line
}

interface CandidateConfig {
  direction: string;
  target_station_code: string;
  walking_time: number;
}

// --- Utility: Parse Wait Message ---
function parseWaitMessage(waitMessage: string): number | null {
  if (!waitMessage) return null;
  const msg = waitMessage.trim().toLowerCase();
  if (msg.includes("min")) {
    const match = msg.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
  } else if (msg === "in arrivo") {
    return 1;
  } else if (msg === "updating") {
    return null;
  }
  return null;
}

// --- Data Loading Functions ---
function loadLines(): Line[] {
  const filePath = path.join(process.cwd(), "data", "lines.json");
  const jsonData = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(jsonData);
  const linesData = data.lines || [];
  return linesData.map((ld: any) => {
    const lineInfo = ld.line || {};
    const stations = (ld.stations || []).map((st: any) => ({
      name: st.name || "Unknown",
      code: st.code || "",
      walking_time: 0,
      index: st.index || 0,
      active: false,
    }));
    stations.sort((a: Station, b: Station) => a.index - b.index);
    return {
      name: lineInfo.description || "",
      line_code: lineInfo.code || "",
      direction: ld.direction || "",
      stations,
      travel_time_between_stations: 2, // default (will be recalculated)
    } as Line;
  });
}

function updateLinesWithCandidates(lines: Line[], candidates: { [key: string]: CandidateConfig }): void {
  lines.forEach((line) => {
    const cand = candidates[line.line_code];
    if (cand && cand.direction === line.direction) {
      const targetCode = cand.target_station_code;
      const wtime = cand.walking_time;
      line.stations.forEach((st) => {
        if (st.code === targetCode) {
          st.active = true;
          st.walking_time = wtime;
        }
      });
    }
  });
}

// --- Metro API Client ---
class MetroAPI {
  async getWaitingTime(station: Station, lineCode: string): Promise<number | null> {
    const baseUrl = "https://giromilano.atm.it/proxy.tpportal/api/tpPortal";
    const url = `${baseUrl}/tpl/stops/${station.code}/linesummary`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Origin": "https://giromilano.atm.it",
          "Referer": "https://giromilano.atm.it/",
        },
      });
      if (!res.ok) {
        console.error(`HTTP error ${res.status} for station ${station.name}`);
        return null;
      }
      const data = await res.json();
      if (data && data.Lines) {
        for (const lineObj of data.Lines) {
          if (lineObj.Line && lineObj.Line.LineCode === lineCode) {
            const rawMsg = lineObj.WaitMessage;
            return parseWaitMessage(rawMsg);
          }
        }
      }
      return null;
    } catch (error: any) {
      console.error(`Error fetching waiting time for station ${station.name}: ${error.message}`);
      return null;
    }
  }
}

// --- Core Logic Functions ---
// Gather raw waits from candidate station (index) down to 0.
async function gatherRawWaits(line: Line, candidateIdx: number, api: MetroAPI): Promise<(number | null)[]> {
  const rawWaits: (number | null)[] = [];
  for (let i = candidateIdx; i >= 0; i--) {
    const station = line.stations[i];
    const wt = await api.getWaitingTime(station, line.line_code);
    rawWaits.push(wt);
  }
  return rawWaits;
}

// Compute average travel time from contiguous segment of nonincreasing raw waits.
// Convert null to 0.
function computeAverageTravelTime(rawList: (number | null)[]): number {
  const numeric = rawList.map((x) => (x === null ? 0 : x));
  const differences: number[] = [];
  for (let i = 0; i < numeric.length - 1; i++) {
    const current = numeric[i];
    const next = numeric[i + 1];
    if (next > current) break;
    differences.push(current - next);
  }
  if (differences.length > 0) {
    const sum = differences.reduce((acc, d) => acc + d, 0);
    const avg = sum / differences.length;
    return avg > 0 ? avg : 2;
  }
  return 2;
}

// Compute arrival time: raw_wait + (distance * avg_travel_time)
function computeArrival(line: Line, stationIdx: number, candidateIdx: number, rawWait: number, avgTravelTime: number): number {
  const dist = candidateIdx - stationIdx;
  return rawWait + dist * avgTravelTime;
}

// Detect up to n trams using the rule: first element is tram #1;
// then if numeric[i] > numeric[i-1] then that's a new tram.
async function findNTramsIncrement(
  station: Station,
  line: Line,
  api: MetroAPI,
  n: number = 3
): Promise<{ arrival: number; feasible: boolean; walk_time: number; wait_at_stop: number | null; raw_wait: number; station_idx: number }[]> {
  const candidateIdx = station.index;
  const walkingTime = station.walking_time;
  const rawList = await gatherRawWaits(line, candidateIdx, api);
  console.log(`Raw waits for line ${line.line_code} (station idx=${candidateIdx} -> 0):`, rawList);
  if (!rawList || rawList.length === 0) return [];
  const avgTravelTime = computeAverageTravelTime(rawList);
  console.log(`Computed average travel time for line ${line.line_code} = ${avgTravelTime}`);
  const numeric = rawList.map((x) => (x === null ? 0 : x));
  const found: { raw_wait: number; station_idx: number }[] = [];
  // Tram #1: candidate station's raw wait
  found.push({ raw_wait: numeric[0], station_idx: candidateIdx });
  // Look for subsequent trams: whenever numeric[i] > numeric[i-1]
  for (let i = 1; i < numeric.length; i++) {
    if (found.length >= n) break;
    if (numeric[i] > numeric[i - 1]) {
      found.push({ raw_wait: numeric[i], station_idx: candidateIdx - i });
    }
  }
  const results = [];
  for (const tram of found) {
    const rw = tram.raw_wait;
    const st_idx = tram.station_idx;
    const arrival = computeArrival(line, st_idx, candidateIdx, rw, avgTravelTime);
    const feasible = arrival >= walkingTime;
    const wait_at_stop = feasible ? arrival - walkingTime : null;
    results.push({
      arrival,
      feasible,
      walk_time: walkingTime,
      wait_at_stop,
      raw_wait: rw,
      station_idx: st_idx,
    });
  }
  return results.slice(0, n);
}

async function planTrip(api: MetroAPI, candidates: { [key: string]: CandidateConfig }): Promise<{ [key: string]: any[] }> {
  const lines = loadLines();
  updateLinesWithCandidates(lines, candidates);
  const out: { [key: string]: any[] } = {};
  for (const line of lines) {
    const cand = line.stations.find((st) => st.active);
    if (cand) {
      const tramList = await findNTramsIncrement(cand, line, api, 3);
      if (tramList.length > 0) {
        const key = `${cand.name} (${line.name}, Direction ${line.direction})`;
        out[key] = tramList;
      }
    }
  }
  return out;
}

async function bestTram(tripPlan: { [key: string]: any[] }): Promise<any | null> {
  const feasibleOptions: { stationLine: string; info: any }[] = [];
  for (const [stationLine, tramInfos] of Object.entries(tripPlan)) {
    for (const info of tramInfos) {
      if (info.feasible) {
        feasibleOptions.push({ stationLine, info });
      }
    }
  }
  if (feasibleOptions.length === 0) return null;
  feasibleOptions.sort((a, b) => a.info.arrival - b.info.arrival);
  return feasibleOptions[0];
}

// --- In-Memory Cache (expires after 60 seconds) ---
let cachedPlan: any = null;
let lastCacheTime = 0;
async function getTripPlan(api: MetroAPI, candidates: { [key: string]: CandidateConfig }): Promise<any> {
  const now = Date.now();
  if (cachedPlan && now - lastCacheTime < 60000) {
    return cachedPlan;
  }
  cachedPlan = await planTrip(api, candidates);
  lastCacheTime = now;
  return cachedPlan;
}

// --- Next.js API GET Handler ---
export async function GET(req: NextRequest) {
  try {
    // Parse candidates from query parameter "candidates" (expected as a JSON string)
    const { searchParams } = new URL(req.url);
    let candidatesParam = searchParams.get("candidates");
    let candidates: { [key: string]: CandidateConfig } = {};
    if (candidatesParam) {
      try {
        candidates = JSON.parse(candidatesParam);
      } catch (e) {
        console.error("Error parsing candidates parameter", e);
        return NextResponse.json({ error: "Invalid candidates parameter" }, { status: 400 });
      }
    } else {
      // Default candidates if none provided
      candidates = {
        "15": { direction: "0", target_station_code: "15371", walking_time: 8 },
        "3": { direction: "0", target_station_code: "11139", walking_time: 4 },
      };
    }

    const api = new MetroAPI();
    const tripPlan = await getTripPlan(api, candidates);
    const best = await bestTram(tripPlan);
    return NextResponse.json({ tripPlan, bestTram: best });
  } catch (error: any) {
    console.error("Error in tram API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
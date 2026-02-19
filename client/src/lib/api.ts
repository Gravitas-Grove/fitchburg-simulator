const BASE = '/api';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function apiStreamUrl(path: string): string {
  return `${BASE}${path}`;
}

export interface ScenarioParcel {
  parcelNo: string;
  address: string;
  owner: string;
  schoolDistrict: string;
  areaAcres: number;
  landValue: number | null;
  developYear: number;
  priorityScore: number;
  scenarioReason: string;
  centroid: [number, number];
  coordinates: number[][][];
}

interface ParcelsResponse {
  scenarioId: string;
  totalParcels: number;
  yearRange: { start: number; end: number };
  parcels: ScenarioParcel[];
}

export async function fetchScenarioParcels(
  scenarioId: string,
  yearStart?: number,
  yearEnd?: number
): Promise<ParcelsResponse> {
  const params = new URLSearchParams();
  if (yearStart) params.set('yearStart', yearStart.toString());
  if (yearEnd) params.set('yearEnd', yearEnd.toString());
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<ParcelsResponse>(`/scenarios/${scenarioId}/parcels${qs}`);
}

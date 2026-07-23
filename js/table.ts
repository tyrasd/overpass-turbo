import Papa from "papaparse";

import {htmlentities} from "./misc";

export type TableData = {columns: string[]; rows: object[]};

export function parseCSVText(text: string): TableData | null {
  const result = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true
  });
  if (result.errors.length > 0 || result.data.length === 0) return null;
  const columns = result.meta.fields ?? [];
  if (columns.length === 0) return null;
  return {columns, rows: result.data as object[]};
}

export function objectsToTable(arr: object[]): TableData {
  const colSet = new Set<string>();
  for (const el of arr) {
    if (el && typeof el === "object") {
      for (const k of Object.keys(el)) colSet.add(k);
    }
  }
  return {columns: Array.from(colSet), rows: arr};
}

export function geoJsonToTable(features: any[]): TableData {
  const rows = features.map((f) => {
    const row: Record<string, any> = {};
    row.coordinates = JSON.stringify(f.geometry?.coordinates ?? "");
    const props = f.properties ?? {};
    for (const [k, v] of Object.entries(props)) {
      if (typeof v === "object" && v !== null) {
        row[k] = JSON.stringify(v);
      } else {
        row[k] = v;
      }
    }
    return row;
  });
  return objectsToTable(rows);
}

export function findArrayInObj(obj: any): any[] | null {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v;
    }
  }
  return null;
}

export function renderTable(tableEl: HTMLElement, data: TableData) {
  let html = "<table><thead><tr>";
  for (const col of data.columns) {
    html += "<th scope=\"col\">" + htmlentities(col) + "</th>";
  }
  html += "</tr></thead><tbody>";
  for (const row of data.rows) {
    html += "<tr>";
    for (const col of data.columns) {
      let val: any = row[col];
      if (val === undefined || val === null) val = "";
      else if (typeof val === "object") val = JSON.stringify(val);
      html += "<td>" + htmlentities(String(val)) + "</td>";
    }
    html += "</tr>";
  }
  html += "</tbody></table>";
  tableEl.innerHTML = html;
}

export function updateTableFromRawData(
  resultText: string,
  tableEl: HTMLElement
) {
  let parsed: TableData | null = null;
  const text = resultText.trim();
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const data = JSON.parse(text);
      const arr = findArrayInObj(data);
      if (arr) {
        parsed =
          arr.length > 0 && arr[0].type === "Feature"
            ? geoJsonToTable(arr)
            : objectsToTable(arr);
      }
    } catch (e) {
      // not valid JSON
    }
  }
  if (!parsed) {
    parsed = parseCSVText(text);
  }
  if (parsed && parsed.rows.length > 0) {
    renderTable(tableEl, parsed);
  } else {
    tableEl.innerHTML =
      "<p style='padding:12px;color:#888'>No tabular data to display.</p>";
  }
}

export function updateTableFromGeoJson(
  features: any[] | undefined,
  tableEl: HTMLElement
) {
  if (features && features.length > 0) {
    const parsed = geoJsonToTable(features);
    renderTable(tableEl, parsed);
  } else {
    tableEl.innerHTML = "";
  }
}

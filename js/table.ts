import {Grid, h} from "gridjs";
import Papa from "papaparse";

import i18n from "./i18n";
import {flattenProperties} from "./ide";

export type TableData = {columns: string[]; rows: object[]};

/** Rows per page, once there are more rows than this. Below the limit, showing
 *  everything at once beats a row of pagination buttons. */
const pageSize = 100;

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

export function objectsToTable(rows: object[]): TableData {
  const colSet = new Set<string>();
  rows = rows.map((el) => {
    if (el && typeof el === "object") {
      for (const k in el) colSet.add(k);
    }
    return el;
  });
  return {columns: sortCols(colSet, rows), rows};
}

export function geoJsonToTable(features: GeoJSON.Feature[]): TableData {
  const colSet = new Set<string>();
  const rows = features.map((f: GeoJSON.Feature) => {
    const row: Record<string, any> = {};
    if (f.geometry.type === "GeometryCollection") {
      row["@geometries"] = JSON.stringify(f.geometry.geometries);
      colSet.add("@geometry");
    } else {
      row["@coordinates"] = JSON.stringify(f.geometry.coordinates);
      colSet.add("@coordinates");
    }
    const props = flattenProperties(f.properties, false);
    for (const [k, v] of Object.entries(props)) {
      colSet.add(k);
      if (typeof v === "object" && v !== null) {
        row[k] = JSON.stringify(v);
      } else {
        row[k] = v;
      }
    }
    return row;
  });
  return {columns: sortCols(colSet, rows), rows};
}

function sortCols(colSet: Set<string>, rows: object[]) {
  const vals = Array.from(colSet);
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const k in row) {
      counts[k] = (counts[k] || 0) + 1;
    }
  }
  return vals.sort((a, b) => {
    const countDiff = counts[b] - counts[a];
    if (countDiff != 0) return countDiff > 0 ? 1 : -1;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
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

// The grid rendered into a container, so that a new query replaces the previous
// one instead of leaving its preact tree behind.
const grids = new WeakMap<HTMLElement, Grid>();

/** Grid.js sorts on the raw cell values, which only orders a column correctly
 *  if all of its values share a type. Columns that hold nothing but numbers
 *  (an Overpass result's `lat`/`lon`, say) are kept numeric so that they sort
 *  as numbers, every other column is stringified. */
function numericColumns(data: TableData): boolean[] {
  return data.columns.map((col) => {
    let numbers = 0;
    for (const row of data.rows) {
      const val = row[col];
      // empty cells stay empty strings, they carry no type information
      if (val === undefined || val === null || val === "") continue;
      if (typeof val !== "number" || !Number.isFinite(val)) return false;
      numbers++;
    }
    return numbers > 0;
  });
}

function cellValue(val: unknown, numeric: boolean) {
  if (val === undefined || val === null) return "";
  if (numeric && typeof val === "number") return val;
  // nested objects, such as an Overpass element's `tags`, would otherwise be
  // rendered as "[object Object]"
  if (typeof val === "object") return JSON.stringify(val);
  // only primitives are left, which stringify predictably
  return (val as string | number | boolean).toString();
}

/** what ends up in a cell: a value Grid.js can sort and search */
type CellValue = ReturnType<typeof cellValue>;

/** cells with no value, i.e. the ones the null marker is shown in */
function isEmpty(cell: unknown) {
  return cell === "" || cell === undefined || cell === null;
}

/** Grid.js escapes plain cell values, so the cell contents can be passed on as
 *  they are. */
function toGridData(data: TableData) {
  const numeric = numericColumns(data);
  const columns = data.columns.map((name, index) => ({
    // Data columns can be named anything, including "" and names that Grid.js
    // would rewrite into a column id of its own, so the id is ours and the
    // lookup into the row is spelled out.
    id: String(index),
    name,
    data: (row: Record<string, CellValue>) => row[name],
    // Styling the cell contents is left to the formatter on purpose: anything
    // other than a plain value would break sorting and searching.
    formatter: (cell: CellValue) =>
      isEmpty(cell) ? h("em", {className: "table-null"}, "null") : cell,
    attributes: (
      cell: CellValue,
      row: any,
      column: (typeof columns)[number]
    ) => {
      if (
        row === null || // row is null for table header
        cell !== null // cell has content
      ) {
        return {
          title: column.name
        };
      }
    },
    sort: {
      // Grid.js' own comparator calls cells without a value equal to
      // everything else, which leaves the sort order up to the browser. Sort
      // them last instead, so the order is the same everywhere.
      compare: (a: CellValue, b: CellValue) => {
        if (isEmpty(a) || isEmpty(b)) {
          return isEmpty(a) && isEmpty(b) ? 0 : isEmpty(a) ? 1 : -1;
        }
        if (name === "@id") {
          // sort osm id column numerically
          a = +a.toString().replace(/(node|way|relation)\//, "");
          b = +b.toString().replace(/(node|way|relation)\//, "");
        }
        return a < b ? -1 : a > b ? 1 : 0;
      }
    }
  }));
  const rows = data.rows.map((row) => {
    const cells: Record<string, CellValue> = {};
    data.columns.forEach((col, index) => {
      cells[col] = cellValue(row[col], numeric[index]);
    });
    return cells;
  });
  return {columns, rows};
}

function gridLanguage() {
  return {
    search: {placeholder: i18n.t("table.search_placeholder")},
    sort: {
      sortAsc: i18n.t("table.sort_asc"),
      sortDesc: i18n.t("table.sort_desc")
    },
    pagination: {
      previous: i18n.t("table.page_prev"),
      next: i18n.t("table.page_next"),
      firstPage: i18n.t("table.page_first"),
      lastPage: i18n.t("table.page_last"),
      page: (page: number) =>
        i18n.t("table.page").replace("{{page}}", String(page)),
      navigate: (page: number, total: number) =>
        i18n
          .t("table.page_of")
          .replace("{{page}}", String(page))
          .replace("{{total}}", String(total)),
      showing: i18n.t("table.summary_showing"),
      to: i18n.t("table.summary_to"),
      of: i18n.t("table.summary_of"),
      results: i18n.t("table.summary_results")
    }
  };
}

export function clearTable(tableEl: HTMLElement) {
  grids.get(tableEl)?.destroy();
  grids.delete(tableEl);
  // Grid.js refuses to render into a container that still has children
  tableEl.replaceChildren();
}

export function renderTable(tableEl: HTMLElement, data: TableData) {
  const {columns, rows} = toGridData(data);
  const grid = new Grid({
    columns,
    data: rows,
    sort: {multiColumn: false},
    search: true,
    pagination:
      rows.length > pageSize ? {limit: pageSize, buttonsCount: 5} : false,
    language: gridLanguage()
  });
  clearTable(tableEl);
  grid.render(tableEl);
  grids.set(tableEl, grid);
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
    } catch {
      // not valid JSON
    }
  }
  if (!parsed) {
    parsed = parseCSVText(text);
  }
  if (parsed && parsed.rows.length > 0) {
    renderTable(tableEl, parsed);
  } else {
    // Show no data
    clearTable(tableEl);
    const p = document.createElement("p");
    p.className = "table-message";
    p.textContent = i18n.t("table.no_data");
    tableEl.appendChild(p);
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
    clearTable(tableEl);
  }
}

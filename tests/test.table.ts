import {afterEach, beforeEach, describe, expect, it} from "vite-plus/test";

import {
  clearTable,
  geoJsonToTable,
  objectsToTable,
  parseCSVText,
  renderTable,
  updateTableFromGeoJson,
  updateTableFromRawData
} from "../js/table";

let tableEl: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = "<div id='table'></div>";
  tableEl = document.getElementById("table");
});

afterEach(() => {
  // grid.js keeps rendering from timers, which would blow up once the test
  // environment is gone
  clearTable(tableEl);
});

/** Grid.js throttles its data pipeline to 100ms and fills the table in from
 *  effects, so its contents are only there a moment after rendering. */
async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 200));
}

/** the text of every cell of the rendered table, row by row */
function renderedRows(): string[][] {
  return Array.from(tableEl.querySelectorAll("tbody tr")).map((tr) =>
    Array.from(tr.querySelectorAll("td")).map((td) => td.textContent)
  );
}

function renderedHeaders(): string[] {
  return Array.from(tableEl.querySelectorAll("thead th")).map(
    (th) => th.querySelector(".gridjs-th-content").textContent
  );
}

async function clickHeader(index: number) {
  tableEl
    .querySelectorAll("thead th")
    [index].dispatchEvent(new Event("click", {bubbles: true}));
  await settle();
}

describe("parseCSVText", () => {
  it("parses a csv with a header row", () => {
    expect(parseCSVText("osm_id,name\n1,Cafe\n2,Bar")).toEqual({
      columns: ["osm_id", "name"],
      rows: [
        {osm_id: "1", name: "Cafe"},
        {osm_id: "2", name: "Bar"}
      ]
    });
  });
  it("returns null for empty text", () => {
    expect(parseCSVText("")).toBeNull();
  });
});

describe("objectsToTable", () => {
  it("collects the union of all keys as columns", () => {
    expect(objectsToTable([{a: 1}, {b: 2}])).toEqual({
      columns: ["a", "b"],
      rows: [{a: 1}, {b: 2}]
    });
  });
});

describe("geoJsonToTable", () => {
  it("turns a feature's geometry into a coordinates column", () => {
    const table = geoJsonToTable([
      {
        type: "Feature",
        properties: {name: "Cafe"},
        geometry: {type: "Point", coordinates: [12.4, 41.8]}
      }
    ]);
    expect(table.columns).toEqual(["coordinates", "name"]);
    expect(table.rows[0]).toEqual({
      coordinates: "[12.4,41.8]",
      name: "Cafe"
    });
  });
});

describe("renderTable", () => {
  it("renders one header cell per column and one row per record", async () => {
    renderTable(tableEl, {
      columns: ["osm_id", "name"],
      rows: [
        {osm_id: 1, name: "Cafe"},
        {osm_id: 2, name: "Bar"}
      ]
    });
    // the table element itself is there right away, its contents follow
    expect(tableEl.querySelectorAll("table.gridjs-table")).toHaveLength(1);
    await settle();
    expect(renderedHeaders()).toEqual(["osm_id", "name"]);
    expect(renderedRows()).toEqual([
      ["1", "Cafe"],
      ["2", "Bar"]
    ]);
  });

  it("stringifies values that are not primitives", async () => {
    renderTable(tableEl, {
      columns: ["id", "tags"],
      rows: [{id: 1, tags: {amenity: "cafe"}}]
    });
    await settle();
    expect(renderedRows()).toEqual([["1", '{"amenity":"cafe"}']]);
  });

  it("marks missing values as a grey italic null", async () => {
    renderTable(tableEl, {
      columns: ["a", "b"],
      rows: [{a: null}, {b: undefined}]
    });
    await settle();
    expect(renderedRows()).toEqual([
      ["null", "null"],
      ["null", "null"]
    ]);
    expect(tableEl.querySelectorAll("tbody em.table-null")).toHaveLength(4);
  });

  it("leaves empty strings alone", async () => {
    renderTable(tableEl, {
      columns: ["a"],
      rows: [{a: ""}]
    });
    await settle();
    // an empty string is a value of its own, not a missing one
    expect(tableEl.querySelectorAll("tbody em.table-null")).toHaveLength(1);
  });

  it("escapes cell contents instead of rendering them as markup", async () => {
    renderTable(tableEl, {
      columns: ["name"],
      rows: [{name: "<img src=x onerror=alert(1)>"}]
    });
    await settle();
    expect(tableEl.querySelectorAll("tbody img")).toHaveLength(0);
    expect(renderedRows()).toEqual([["<img src=x onerror=alert(1)>"]]);
  });

  it("sorts a column of numbers by its numeric value", async () => {
    renderTable(tableEl, {
      columns: ["lat"],
      rows: [{lat: 100}, {lat: 9}, {lat: 10}]
    });
    await settle();
    await clickHeader(0);
    // 9 before 10 before 100, which a string comparison would get wrong
    expect(renderedRows()).toEqual([["9"], ["10"], ["100"]]);
    await clickHeader(0);
    expect(renderedRows()).toEqual([["100"], ["10"], ["9"]]);
  });

  it("sorts a column of strings alphabetically", async () => {
    renderTable(tableEl, {
      columns: ["name"],
      rows: [{name: "Cafe"}, {name: "Bar"}]
    });
    await settle();
    await clickHeader(0);
    expect(renderedRows()).toEqual([["Bar"], ["Cafe"]]);
  });

  it("replaces a previously rendered table", async () => {
    renderTable(tableEl, {columns: ["a"], rows: [{a: 1}]});
    await settle();
    renderTable(tableEl, {columns: ["b"], rows: [{b: 2}]});
    await settle();
    expect(tableEl.querySelectorAll("table.gridjs-table")).toHaveLength(1);
    expect(renderedHeaders()).toEqual(["b"]);
  });

  it("sorts a column that contains nulls", async () => {
    renderTable(tableEl, {
      columns: ["lat"],
      rows: [{lat: 3}, {}, {lat: 1}, {lat: 2}]
    });
    await settle();
    await clickHeader(0);
    // cells without a value sort last, rather than comparing as equal to
    // everything and leaving the order to the browser
    expect(renderedRows()).toEqual([["1"], ["2"], ["3"], ["null"]]);
  });

  it("does not match the null marker when searching", async () => {
    renderTable(tableEl, {
      columns: ["name"],
      rows: [{name: "Cafe"}, {name: null}]
    });
    await settle();
    const input = tableEl.querySelector<HTMLInputElement>(
      ".gridjs-search-input"
    );
    input.value = "zzzznope";
    input.dispatchEvent(new Event("input", {bubbles: true}));
    await settle();
    expect(
      tableEl.querySelectorAll("tbody td.gridjs-td:not(.gridjs-message)")
    ).toHaveLength(0);
  });

  it("paginates only once there are more rows than fit on a page", async () => {
    const rows = Array.from({length: 200}, (_, i) => ({a: i}));
    renderTable(tableEl, {columns: ["a"], rows});
    await settle();
    // the first page holds 100 of the 200 rows, the rest sit behind the
    // pagination buttons
    expect(renderedRows()).toHaveLength(100);
    expect(tableEl.querySelector(".gridjs-pagination")).not.toBeNull();
    expect(tableEl.querySelector(".gridjs-pagination").textContent).toContain(
      "200"
    );

    clearTable(tableEl);
    renderTable(tableEl, {columns: ["a"], rows: rows.slice(0, 3)});
    await settle();
    expect(renderedRows()).toHaveLength(3);
    expect(tableEl.querySelector(".gridjs-pagination")).toBeNull();
  });

  it("narrows the rows down to those matching the search", async () => {
    renderTable(tableEl, {
      columns: ["name"],
      rows: [{name: "Cafe"}, {name: "Bar"}, {name: "Cafe Central"}]
    });
    await settle();
    const input = tableEl.querySelector<HTMLInputElement>(
      ".gridjs-search-input"
    );
    expect(input.placeholder).toBe("Filter rows...");
    input.value = "cafe";
    input.dispatchEvent(new Event("input", {bubbles: true}));
    await settle();
    expect(renderedRows()).toEqual([["Cafe"], ["Cafe Central"]]);
  });
});

describe("clearTable", () => {
  it("empties the container", () => {
    renderTable(tableEl, {columns: ["a"], rows: [{a: 1}]});
    clearTable(tableEl);
    expect(tableEl.innerHTML).toBe("");
  });
});

describe("updateTableFromRawData", () => {
  it("renders csv", async () => {
    updateTableFromRawData("osm_id,name\n1,Cafe", tableEl);
    await settle();
    expect(renderedHeaders()).toEqual(["osm_id", "name"]);
    expect(renderedRows()).toEqual([["1", "Cafe"]]);
  });

  it("renders geojson", async () => {
    updateTableFromRawData(
      JSON.stringify([
        {
          type: "Feature",
          properties: {name: "Cafe"},
          geometry: {type: "Point", coordinates: [12.4, 41.8]}
        }
      ]),
      tableEl
    );
    await settle();
    expect(renderedHeaders()).toEqual(["coordinates", "name"]);
    expect(renderedRows()).toEqual([["[12.4,41.8]", "Cafe"]]);
  });

  it("renders a json array of objects", async () => {
    updateTableFromRawData('[{"a": 1}, {"a": 2}]', tableEl);
    await settle();
    expect(renderedHeaders()).toEqual(["a"]);
    expect(renderedRows()).toEqual([["1"], ["2"]]);
  });

  it("shows a message when there is nothing to display", () => {
    updateTableFromRawData("42", tableEl);
    expect(tableEl.querySelector("table")).toBeNull();
    expect(tableEl.textContent).not.toBe("");
  });
});

describe("updateTableFromGeoJson", () => {
  it("renders the features", async () => {
    updateTableFromGeoJson(
      [
        {
          type: "Feature",
          properties: {name: "Cafe"},
          geometry: {type: "Point", coordinates: [12.4, 41.8]}
        }
      ],
      tableEl
    );
    await settle();
    expect(renderedHeaders()).toEqual(["coordinates", "name"]);
  });

  it("empties the table when there are no features", () => {
    updateTableFromGeoJson(
      [
        {
          type: "Feature",
          properties: {name: "Cafe"},
          geometry: {type: "Point", coordinates: [12.4, 41.8]}
        }
      ],
      tableEl
    );
    updateTableFromGeoJson(undefined, tableEl);
    expect(tableEl.innerHTML).toBe("");
  });
});

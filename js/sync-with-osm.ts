import {osmAuth} from "osm-auth";

import configs from "./configs";
import {HttpError} from "./httpRequest";

/** a query saved in the user's osm.org preferences */
export interface SyncedQuery {
  name: string;
  query: string;
}

/** a query to store, or — with `deleteMe` — one to remove */
interface QueryUpdate {
  name: string;
  query?: string;
  deleteMe?: boolean;
}

const enabled = configs.osmAuth && configs.osmAuth.client_id;

if (!configs.osmAuth.redirect_uri) {
  configs.osmAuth.redirect_uri = `${window.location.origin}${window.location.pathname}land.html`;
}
configs.osmAuth.scope = "read_prefs write_prefs";

let auth;
if (enabled) auth = osmAuth(configs.osmAuth);

const preferencesPath = "/api/0.6/user/preferences";

/** osm-auth only exposes a callback based authenticate() */
function authenticate(): Promise<void> {
  return new Promise((resolve, reject) => {
    auth.authenticate((err) => (err ? reject(err) : resolve()));
  });
}

/**
 * Like `auth.fetch`, which unlike `auth.xhr` neither resolves the path against
 * the API url nor rejects on a non-2xx response.
 */
async function apiRequest(
  path: string,
  options: RequestInit
): Promise<Response> {
  const res: Response = await auth.fetch(auth.options().apiUrl + path, options);
  if (!res.ok) throw new HttpError(res, await res.text().catch(() => ""));
  return res;
}

export default {
  enabled: enabled,
  async load(): Promise<SyncedQuery[]> {
    if (!auth.authenticated()) await authenticate();
    return (await loadQueries()).queries;
  },
  async save(query: SyncedQuery): Promise<void> {
    if (!auth.authenticated()) await authenticate();
    await saveQuery(query);
  },
  async delete(name: string): Promise<void> {
    if (!auth.authenticated())
      throw new Error("must be logged in to delete a synced query");
    await saveQuery({name: name, deleteMe: true});
  },
  logout() {
    if (auth.authenticated()) auth.logout();
  },
  authenticated() {
    return enabled && auth.authenticated();
  }
};

/** the preferences document is returned alongside the queries, so that
 * saveQuery() can amend it instead of fetching it a second time */
async function loadQueries(): Promise<{
  queries: SyncedQuery[];
  dom: Document;
}> {
  const res = await apiRequest(preferencesPath, {method: "GET"});
  const dom = new DOMParser().parseFromString(
    await res.text(),
    "application/xml"
  );

  let pref_count = 0,
    cnt_elem;
  if (
    (cnt_elem = dom.querySelector(
      `preference[k="${configs.settingNamespace}_query-count"]`
    ))
  )
    pref_count = +cnt_elem.getAttribute("v");

  const queries: SyncedQuery[] = [];
  for (let i = 0; i < pref_count; i++) {
    const pref_elem = dom.querySelector(
      `preference[k="${configs.settingNamespace}_query_${i}_0"]`
    );
    if (!pref_elem) continue;
    const first_chunk = pref_elem.getAttribute("v").split("&");
    const length = +first_chunk[0].slice(2);
    const name = first_chunk[1].slice(2);
    let query = first_chunk[2].slice(2);
    for (let j = 1; j < length; j++) {
      query += dom
        .querySelector(
          `preference[k="${configs.settingNamespace}_query_${i}_${j}"]`
        )
        .getAttribute("v");
    }
    queries.push({
      name: name,
      query: query
    });
  }

  return {queries: queries, dom: dom};
}

async function saveQuery(new_query: QueryUpdate): Promise<void> {
  const {queries, dom} = await loadQueries();
  const existing_queries: QueryUpdate[] = queries;

  const preferences = dom.querySelector("preferences");
  // clean up existing data
  const existing = preferences.querySelectorAll(
    `preference[k^="${configs.settingNamespace}_query"]`
  );
  existing.forEach((e) => e.remove());
  // insert new query into list of existing ones
  let is_new: boolean | number = true;
  existing_queries.forEach((q, idx) => {
    if (q.name == new_query.name) {
      q.query = new_query.query;
      is_new = idx;
    }
  });
  if (is_new === true) {
    existing_queries.push(new_query);
  } else if (new_query.deleteMe) {
    existing_queries.splice(is_new as number, 1);
  }
  // construct new preferences xml
  const new_elem = dom.createElement("preference");
  new_elem.setAttribute("k", `${configs.settingNamespace}_query-count`);
  new_elem.setAttribute("v", String(existing_queries.length));
  preferences.appendChild(new_elem);
  for (let i = 0; i < existing_queries.length; i++) {
    const q = existing_queries[i];
    if (q.name.length > 200)
      throw new Error("query name too long to be saved on osm.org");
    const numParts = Math.ceil((q.query.length + q.name.length + 8) / 255);
    if (numParts > 9) throw new Error("query too long to be saved on osm.org");
    let queryStr = `p=${numParts}`;
    queryStr += `&n=${q.name}`;
    queryStr += `&q=${q.query}`;
    // split into chunks of max 255 characters length
    const chunks = queryStr.match(/.{1,255}/g);

    for (let j = 0; j < numParts; j++) {
      const new_elem = dom.createElement("preference");
      new_elem.setAttribute("k", `${configs.settingNamespace}_query_${i}_${j}`);
      new_elem.setAttribute("v", chunks[j]);
      preferences.appendChild(new_elem);
    }
  }
  // upload to osm.org
  await apiRequest(preferencesPath, {
    method: "PUT",
    headers: {"Content-Type": "text/xml"},
    body: dom.documentElement.outerHTML
  });
}

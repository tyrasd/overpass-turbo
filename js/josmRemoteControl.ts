// JOSM remote control
// https://josm.openstreetmap.de/wiki/Help/RemoteControlCommands
import {request, requestJson} from "./httpRequest";

// JOSM listens on 127.0.0.1 only, so don't rely on how "localhost" resolves
const baseUrl = "http://127.0.0.1:8111/";

function commandUrl(command: string, params: Record<string, string>): URL {
  const url = new URL(command, baseUrl);
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value);
  return url;
}

export interface JosmVersion {
  protocolversion: {major: number; minor: number};
}

/** rejects if JOSM isn't running or has remote control disabled */
export function version(): Promise<JosmVersion> {
  return requestJson<JosmVersion>(commandUrl("version", {}));
}

/** tells JOSM to download the given objects, e.g. `n1,w2,r3` */
export async function loadObject(objects: string): Promise<void> {
  await request(commandUrl("load_object", {objects, relation_members: "true"}));
}

/** tells JOSM to download the data served at `dataUrl` */
export async function importUrl(dataUrl: string): Promise<void> {
  await request(commandUrl("import", {url: dataUrl}));
}

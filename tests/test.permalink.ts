import {describe, expect, it} from "vitest";
import ide from "../js/ide";

describe("ide.permalink", () => {
  // check share links
  it("share uncompressed", () => {
    const q =
      '<!--\nThis is an example Overpass query.\nTry it out by pressing the Run button above!\nYou can find more examples with the Load tool.\n-->\n<query type="node">\n  <has-kv k="amenity" v="drinking_water"/>\n  <bbox-query {{bbox}}/><!--this is auto-completed with the\n                   current map view coordinates.-->\n</query>\n<print/>';
    const p = ide.compose_share_link(q, false, false, false);
    expect(p).to.eql(
      "?Q=%3C%21--%0AThis+is+an+example+Overpass+query.%0ATry+it+out+by+pressing+the+Run+button+above%21%0AYou+can+find+more+examples+with+the+Load+tool.%0A--%3E%0A%3Cquery+type%3D%22node%22%3E%0A++%3Chas-kv+k%3D%22amenity%22+v%3D%22drinking_water%22%2F%3E%0A++%3Cbbox-query+%7B%7Bbbox%7D%7D%2F%3E%3C%21--this+is+auto-completed+with+the%0A+++++++++++++++++++current+map+view+coordinates.--%3E%0A%3C%2Fquery%3E%0A%3Cprint%2F%3E"
    );
    expect(p).not.to.have.string("?q=");
    expect(p).not.to.have.string("&C=");
    expect(p).not.to.have.string("&c=");
    expect(p).not.to.have.string("&R");
  });
  it("share compressed", () => {
    const q =
      '<!--\nThis is an example Overpass query.\nTry it out by pressing the Run button above!\nYou can find more examples with the Load tool.\n-->\n<query type="node">\n  <has-kv k="amenity" v="drinking_water"/>\n  <bbox-query {{bbox}}/><!--this is auto-completed with the\n                   current map view coordinates.-->\n</query>\n<print/>';
    const p = ide.compose_share_link(q, true, false, false);
    expect(p).not.to.have.string("?Q=");
    expect(p).to.eql(
      "?q=PCEtLQpUaGlzIMSHIGFuIGV4YW1wbGUgT3ZlcnBhc8SIcXXEmXkuxIRyecSJdCBvdcSoYsSmcHJlxJ1pbmcgdGjElVJ1xI1ixKt0b8SNYWJvxJghClnEqiBjxIwgZsSzZCBtb8SwxI7EkMSSxJTEiHdpxLfEtsS4IExvYcWQxL9vbMSjxII-CjzEn8ShxLZ5cGU9Im5vZGUixakgIDxoxJwta3Yga8WyxJFlbsWbeSIgdsWyZHLEs2vEs2dfd2F0xJkiL8W5xbtixYN4LcWsxKUge3vGnW94fX3GmsSAxILEt8SKxIphxKtvLWNvxZdlxpfFkMWaxZzEt2UKxbrHgMeBx4LHgmN1csSwbsSobWFwxotpZXfFim_Fk2TEs8aWxLEuxajFqi_GoXnFqTzEr8SzdMaa"
    );
    expect(p).not.to.have.string("&C=");
    expect(p).not.to.have.string("&c=");
    expect(p).not.to.have.string("&R");
  });
  it("share coordinates", () => {
    const q = " ";
    ide.map = {
      getCenter() {
        return {lat: 12.3456, lng: -65.4321};
      },
      getZoom() {
        return 8;
      }
    };
    let p = ide.compose_share_link(q, false, true, false);
    expect(p).to.have.string("&C=12.3456%3B-65.4321%3B8");
    expect(p).not.to.have.string("&c=");
    p = ide.compose_share_link(q, true, true, false);
    expect(p).not.to.have.string("&C=");
    expect(p).to.have.string("&c=Au47axyXAI");
  });
  it("share autorun", () => {
    const q = " ";
    const p = ide.compose_share_link(q, false, false, true);
    expect(p).to.have.string("&R");
  });
});

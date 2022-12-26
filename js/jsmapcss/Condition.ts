// ----------------------------------------------------------------------
// Condition base class

import styleparser from "./Style";

styleparser.Condition = function () {};
styleparser.Condition.prototype = {
  type: "", // eq/ne/regex etc.
  params: [], // what to test against

  init(_type, ..._params) {
    // summary:		A condition to evaluate.
    this.type = _type;
    this.params = _params;
    return this;
  },

  test(tags) {
    // summary:		Run the condition against the supplied tags.
    const p = this.params;
    switch (this.type) {
      case "eq":
        return tags[p[0]] == p[1];
      case "ne":
        return tags[p[0]] != p[1];
      case "regex":
        return (
          tags[p[0]] !== undefined && new RegExp(p[1], "i").test(tags[p[0]])
        );
      case "true":
        return tags[p[0]] == "true" || tags[p[0]] == "yes" || tags[p[0]] == "1";
      case "false":
        return tags[p[0]] == "false" || tags[p[0]] == "no" || tags[p[0]] == "0";
      case "set":
        return tags[p[0]] !== undefined && tags[p[0]] !== "";
      case "unset":
        return tags[p[0]] === undefined || tags[p[0]] === "";
      case "<":
        return Number(tags[p[0]]) < Number(p[1]);
      case "<=":
        return Number(tags[p[0]]) <= Number(p[1]);
      case ">":
        return Number(tags[p[0]]) > Number(p[1]);
      case ">=":
        return Number(tags[p[0]]) >= Number(p[1]);
    }
    return false;
  },

  toString() {
    return `[${this.type}: ${this.params}]`;
  }
};

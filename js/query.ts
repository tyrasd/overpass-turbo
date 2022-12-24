// query parser module
import _ from "lodash";

export default function query() {
  let statements = {};

  const parser = {};

  parser.parse = function (query, shortcuts, callback, _found_statements) {
    // 1. get user defined constants
    const constants = {};
    const constant = /{{([A-Za-z0-9_]+)=(.+?)}}/;
    let c;
    while ((c = query.match(constant))) {
      const c_name = c[1];
      const c_val = c[2];
      constants[c_name] = c_val;
      // remove constant definitions
      query = query.replace(constant, "");
    }
    _.extend(shortcuts, constants, (b, a) => (typeof a == "undefined" ? b : a));
    // 2. replace overpass turbo statements, user-constants and shortcuts
    statements = {};
    if (_found_statements) statements = _found_statements;
    const statement = /{{([A-Za-z0-9_]+)(:([\s\S]*?))?}}/;
    let s;
    while ((s = query.match(statement))) {
      const s_name = s[1];
      const s_instr = s[3] || "";
      let s_replace = "";
      // save instructions for later
      if (statements[s_name] === undefined) statements[s_name] = "";
      statements[s_name] += s_instr;
      // if the statement is a shortcut, replace its content
      if (shortcuts[s_name] !== undefined) {
        // these shortcuts can also be callback functions, like {{date:-1day}}
        if (typeof shortcuts[s_name] === "function") {
          shortcuts[s_name](s_instr, (res) => {
            const seed = Math.round(Math.random() * Math.pow(2, 22)); // todo: use some kind of checksum of s_instr if possible
            shortcuts[`__statement__${s_name}__${seed}`] = res;
            query = query.replace(
              s[0],
              `{{__statement__${s_name}__${seed}:${s_instr}}}`
            );
            // recursively call the parser with updated shortcuts
            parser.parse(query, shortcuts, callback, statements);
          });
          return;
        } else s_replace = shortcuts[s_name];
      }
      // remove statement, but preserve number of newlines
      const lc = s_instr.split(/\r?\n|\r/).length;
      query = query.replace(s[0], s_replace + Array(lc).join("\n"));
    }
    // 3. remove remaining (e.g. unknown) mustache templates:
    let m;
    while ((m = query.match(/{{[\S\s]*?}}/gm))) {
      // count lines in template and replace mustache with same number of newlines
      const lc = m[0].split(/\r?\n|\r/).length;
      query = query.replace(m[0], Array(lc).join("\n"));
    }
    // return the query
    callback(query);
  };

  parser.hasStatement = function (statement) {
    // eslint-disable-next-line no-prototype-builtins
    return statements.hasOwnProperty(statement);
  };

  parser.getStatement = function (statement) {
    return statements[statement];
  };

  return parser;
}

// query autorepair module
import $ from "jquery";

import {Base64} from "./misc";

export default function autorepair(q, lng) {
  const repair = {};

  const comments = {};

  (function init() {
    // replace comments with placeholders
    // (we do not want to autorepair stuff which is commented out.)
    let cs, placeholder;
    if (lng == "xml") {
      cs = q.match(/<!--[\s\S]*?-->/g) || [];
      for (const csi of cs) {
        placeholder = `<!--${Base64.encode(Math.random().toString())}-->`; //todo: use some kind of checksum or hash maybe?
        q = q.replace(csi, placeholder);
        comments[placeholder] = csi;
      }
    } else {
      cs = q.match(/\/\*[\s\S]*?\*\//g) || []; // multiline comments: /*...*/
      for (const csi of cs) {
        placeholder = `/*${Base64.encode(Math.random().toString())}*/`; //todo: use some kind of checksum or hash maybe?
        q = q.replace(csi, placeholder);
        comments[placeholder] = csi;
      }
      cs = q.match(/\/\/[^\n]*/g) || []; // single line comments: //...
      for (const csi of cs) {
        placeholder = `/*${Base64.encode(Math.random().toString())}*/`; //todo: use some kind of checksum or hash maybe?
        q = q.replace(csi, placeholder);
        comments[placeholder] = csi;
      }
    }
  })();

  repair.getQuery = () => {
    // expand placeholded comments
    for (const placeholder in comments) {
      q = q.replace(placeholder, comments[placeholder]);
    }
    return q;
  };

  repair.recurse = () => {
    if (lng == "xml") {
      // do some fancy mixture between regex magic and xml as html parsing :€
      const prints =
        q.match(/(\n?[^\S\n]*<print[\s\S]*?(\/>|<\/print>))/g) || [];
      for (let i = 0; i < prints.length; i++) {
        const ws = prints[i].match(/^\n?(\s*)/)[1]; // amount of whitespace in front of each print statement
        const from = $("print", $.parseXML(prints[i])).attr("from");
        let add1, add2, add3;
        if (from) {
          add1 = ` into="${from}"`;
          add2 = ` set="${from}"`;
          add3 = ` from="${from}"`;
        } else {
          add1 = "";
          add2 = "";
          add3 = "";
        }
        q = q.replace(
          prints[i],
          `\n${ws}<!-- added by auto repair -->\n${ws}<union${add1}>\n${ws}  <item${add2}/>\n${ws}  <recurse${add3} type="down"/>\n${ws}</union>\n${ws}<!-- end of auto repair --><autorepair>${i}</autorepair>`
        );
      }
      for (let i = 0; i < prints.length; i++)
        q = q.replace(`<autorepair>${i}</autorepair>`, prints[i]);
    } else {
      const outs = q.match(/(\n?[^\S\n]*(\.[^.;]+)?out[^:;"\]]*;)/g) || [];
      for (let i = 0; i < outs.length; i++) {
        const ws = outs[i].match(/^\n?(\s*)/)[0]; // amount of whitespace
        const from = outs[i].match(/\.([^;.]+?)\s+out/);
        let add;
        if (from) add = `(.${from[1]};.${from[1]} >;)->.${from[1]};`;
        else add = "(._;>;);";
        q = q.replace(
          outs[i],
          `${ws}/*added by auto repair*/${ws}${add}${ws}/*end of auto repair*/<autorepair>${i}</autorepair>`
        );
      }
      for (let i = 0; i < outs.length; i++)
        q = q.replace(`<autorepair>${i}</autorepair>`, outs[i]);
    }
    return true;
  };

  repair.editors = () => {
    if (lng == "xml") {
      // 1. fix <osm-script output=*
      const src = q.match(/<osm-script([^>]*)>/);
      if (src) {
        const output = $(
          "osm-script",
          $.parseXML(`${src[0]}</osm-script>`)
        ).attr("output");
        if (output && output != "xml") {
          const new_src = src[0].replace(output, "xml");
          q = q.replace(src[0], `${new_src}<!-- fixed by auto repair -->`);
        }
      }
      // 2. fix <print mode=*
      const prints = q.match(/(<print[\s\S]*?(\/>|<\/print>))/g) || [];
      for (const print_i of prints) {
        const print = $("print", $.parseXML(print_i)),
          mode = print.attr("mode"),
          geometry = print.attr("geometry");
        let add = "";
        let new_print;
        let repaired = false;
        if (mode !== "meta") {
          print.attr("mode", "meta");
          repaired = true;
        }
        if (geometry && geometry !== "skeleton") {
          print.attr("geometry", null);
          const out_set = print.attr("from");
          if (!out_set) {
            add = '<union><item/><recurse type="down"/></union>';
          } else {
            add = `<union into="${out_set}"><item set="${out_set}"/><recurse from="${out_set}" type="down"/></union>`;
          }
          repaired = true;
        }
        if (repaired) {
          new_print = add + new XMLSerializer().serializeToString(print[0]);
          new_print += "<!-- fixed by auto repair -->";
          q = q.replace(print_i, new_print);
        }
      }
    } else {
      // 1. fix [out:*]
      const out = q.match(/\[\s*out\s*:\s*([^\]\s]+)\s*\]\s*;?/);
      ///^\s*\[\s*out\s*:\s*([^\]\s]+)/);
      if (out && out[1] != "xml")
        q = q.replace(
          /(\[\s*out\s*:\s*)([^\]\s]+)(\s*\]\s*;?)/,
          "$1xml$3/*fixed by auto repair*/"
        );
      // 2. fix print statements: non meta output, overpass geometries
      const prints = q.match(/(\.([^;.]+?)\s+)?(out[^:;"\]]*;)/g) || [];
      for (const print_i of prints) {
        // eslint-disable-next-line prefer-const
        let [print, , out_set, out_statement] = print_i.match(
          /(\.([^;.]+?)\s+)?(out[^:;"\]]*;)/
        );
        let new_print = print;
        let new_out_statement;
        // non meta output
        if (
          out_statement.match(/\s(body|skel|ids|tags|count)/) ||
          !out_statement.match(/\s(meta)/)
        ) {
          new_out_statement = out_statement
            .replace(/\s(body|skel|ids|tags|count|meta)/g, "")
            .replace(/^out/, "out meta");
          new_print = new_print.replace(out_statement, new_out_statement);
          out_statement = new_out_statement;
        }
        // overpass geometry modes
        if (out_statement.match(/\s(center|bb|geom)/)) {
          new_out_statement = out_statement.replace(/\s(center|bb|geom)/g, "");
          new_print = new_print.replace(out_statement, new_out_statement);
          out_statement = new_out_statement;
          if (out_set) {
            new_print = `(.${out_set};.${out_set} >;)->.${out_set}; ${new_print}`;
          } else {
            new_print = `(._;>;); ${new_print}`;
          }
        }
        if (new_print != print)
          q = q.replace(print, `${new_print}/*fixed by auto repair*/`);
      }
    }
    return true;
  };

  return repair;
}

autorepair.detect = {};
autorepair.detect.editors = (q, lng) => {
  // todo: test this
  // todo: move into autorepair "module" /// todo. done?
  q = q.replace(/{{.*?}}/g, "");
  const err = {};
  if (lng == "xml") {
    try {
      const xml = $.parseXML(`<x>${q}</x>`);
      const out = $("osm-script", xml).attr("output");
      if (out !== undefined && out !== "xml") err.output = true;
      $("print", xml).each((i, p) => {
        if ($(p).attr("mode") !== "meta") err.meta = true;
      });
      $("print", xml).each((i, p) => {
        if (
          $(p)
            .attr("geometry")
            .match(/(center|bounds|full)/)
        )
          err.geometry = true;
      });
    } catch (e) {} // ignore xml syntax errors ?!
  } else {
    // ignore comments
    q = q.replace(/\/\*[\s\S]*?\*\//g, "");
    q = q.replace(/\/\/[^\n]*/g, "");
    const out = q.match(/\[\s*out\s*:\s*([^\]\s]+)\s*\]/);
    if (out && out[1] != "xml") err.output = true;
    const prints = q.match(/out([^:;]*);/g);
    $(prints).each((i, p) => {
      if (p.match(/\s(body|skel|ids|tags)/) || !p.match(/meta/))
        err.meta = true;
    });
    $(prints).each((i, p) => {
      if (p.match(/\s(center|bb|geom)/)) err.geometry = true;
    });
  }
  return $.isEmptyObject(err);
};

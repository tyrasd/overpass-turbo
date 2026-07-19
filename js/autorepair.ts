// query autorepair module
import $ from "jquery";

import {Base64} from "./misc";
import type {QueryLang} from "./overpass";

/**
 * Repairs obvious mistakes in a query, such as a missing recurse statement or
 * an output format the OSM editors cannot consume.
 *
 * Each repair rewrites the query held by the instance, so several can be
 * applied in turn before reading the result back with {@link getQuery}.
 */
export default class Autorepair {
  /**
   * The comments of the original query, keyed by the placeholder standing in
   * for them, so that commented-out code is not itself repaired.
   */
  private readonly comments: Record<string, string> = {};

  constructor(
    private query: string,
    private readonly lng: QueryLang
  ) {
    const pattern =
      lng == "xml"
        ? [/<!--[\s\S]*?-->/g] // <!--...-->
        : [/\/\*[\s\S]*?\*\//g, /\/\/[^\n]*/g]; // /*...*/ and //...
    for (const comments of pattern) {
      for (const comment of this.query.match(comments) || []) {
        //todo: use some kind of checksum or hash maybe?
        const token = Base64.encode(Math.random().toString());
        const placeholder = lng == "xml" ? `<!--${token}-->` : `/*${token}*/`;
        this.query = this.query.replace(comment, placeholder);
        this.comments[placeholder] = comment;
      }
    }
  }

  /** The query, with the repairs applied and its comments restored. */
  getQuery(): string {
    for (const placeholder in this.comments) {
      this.query = this.query.replace(placeholder, this.comments[placeholder]);
    }
    return this.query;
  }

  /** Makes each output statement also output the elements it references. */
  recurse(): boolean {
    let q = this.query;
    if (this.lng == "xml") {
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
    this.query = q;
    return true;
  }

  /** Rewrites the query to the output format the OSM editors can consume. */
  editors(): boolean {
    let q = this.query;
    if (this.lng == "xml") {
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
      const prints = q.match(/(\.([^;.]+?)\s+)?(\bout\b[^:;"\]]*;)/g) || [];
      for (const print_i of prints) {
        // eslint-disable-next-line prefer-const
        let [print, , out_set, out_statement] = print_i.match(
          /(\.([^;.]+?)\s+)?(\bout[^:;"\]]*;)/
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
    this.query = q;
    return true;
  }

  /**
   * Whether a query already produces output the OSM editors can consume, and
   * so needs no repair by {@link editors}. The two belong together: this must
   * report exactly the problems that one fixes.
   *
   * It is static, and strips comments rather than masking them the way the
   * constructor does, because it only inspects a query — nothing is written
   * back, so the comments just have to be kept from matching.
   */
  // todo: test this
  static isEditorCompatible(q: string, lng: QueryLang): boolean {
    q = q.replace(/{{.*?}}/g, ""); // ignore shortcuts
    if (lng == "xml") {
      try {
        const xml = $.parseXML(`<x>${q}</x>`);
        const output = $("osm-script", xml).attr("output");
        if (output !== undefined && output !== "xml") return false;
        const prints = $("print", xml).toArray();
        if (prints.some((p) => $(p).attr("mode") !== "meta")) return false;
        if (
          prints.some((p) =>
            $(p)
              .attr("geometry")
              .match(/(center|bounds|full)/)
          )
        )
          return false;
      } catch {} // ignore xml syntax errors ?!
      return true;
    }
    // ignore comments
    q = q.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    const out = q.match(/\[\s*out\s*:\s*([^\]\s]+)\s*\]/);
    if (out && out[1] != "xml") return false;
    const prints = q.match(/out([^:;]*);/g) || [];
    if (
      prints.some((p) => p.match(/\s(body|skel|ids|tags)/) || !p.match(/meta/))
    )
      return false;
    return !prints.some((p) => p.match(/\s(center|bb|geom)/));
  }
}

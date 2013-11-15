describe("ide.ffs", function () {

  var ffs;
  before(function() {
    ffs = turbo.ffs();
  });

  function compact(q) {
    q = q.replace(/<\!--[\s\S]*?-->/g,"");
    q = q.replace(/<osm-script output="json" timeout="([^"]*)" ?>/,"");
    q = q.replace(/<\/osm-script>/,"");
    q = q.replace(/<id-query type="([^"]*)" ref="([^"]*)" ?\/>/g,"id($1,$2);");
    q = q.replace(/<id-query \{\{nominatimArea:(.*?)\}\}( into="[^"]*")? ?\/>/g,"areaid($1);");
    q = q.replace(/<has-kv k="([^"]*)" ?\/>/g,"kv($1);");
    q = q.replace(/<has-kv k="([^"]*)" v="([^"]*)" ?\/>/g,"kv($1,$2);");
    q = q.replace(/<has-kv k="([^"]*)" modv="not" v="([^"]*)" ?\/>/g,"kv($1,not,$2);");
    q = q.replace(/<has-kv k="([^"]*)" regv="([^"]*)" ?\/>/g,"kvr($1,$2);");
    q = q.replace(/<has-kv k="([^"]*)" modv="not" regv="([^"]*)" ?\/>/g,"kvr($1,not,$2);");
    q = q.replace(/<bbox-query \{\{bbox\}\} ?\/>/g,"bbox;");
    q = q.replace(/<area-query( from="[^"]*")? ?\/>/g,"area;");
    q = q.replace(/<newer than="([^"]*)" ?\/>/g,"newer($1);");
    q = q.replace(/<union>/g,"(");
    q = q.replace(/<\/union>/g,");");
    q = q.replace(/<query type="([^"]*)">/g,"$1[");
    q = q.replace(/<\/query>/g,"];");
    q = q.replace(/<print mode="([^"]*)"( order="[^"]*")? ?\/>/g,"print($1);");
    q = q.replace(/<recurse type="([^"]*)" ?\/>/g,"recurse($1);");
    q = q.replace(/ *\n */g,"");
    return q;
  };
  var out_str = "print(body);recurse(down);print(skeleton);";

  // basic conditions
  describe("basic conditions", function () {
    // key
    it("key=*", function () {
      var search = "foo=*";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(foo);bbox;];"+
          "way[kv(foo);bbox;];"+
          "relation[kv(foo);bbox;];"+
        ");"+
        out_str
      );
    });
    // not key
    it("key!=*", function () {
      var search = "foo!=*";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kvr(foo,not,.);bbox;];"+
          "way[kvr(foo,not,.);bbox;];"+
          "relation[kvr(foo,not,.);bbox;];"+
        ");"+
        out_str
      );
    });
    // key-value
    it("key=value", function () {
      var search = "foo=bar";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(foo,bar);bbox;];"+
          "way[kv(foo,bar);bbox;];"+
          "relation[kv(foo,bar);bbox;];"+
        ");"+
        out_str
      );
    });
    // not key-value
    it("key!=value", function () {
      var search = "foo!=bar";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(foo,not,bar);bbox;];"+
          "way[kv(foo,not,bar);bbox;];"+
          "relation[kv(foo,not,bar);bbox;];"+
        ");"+
        out_str
      );
    });
    // regex key-value
    it("key~value", function () {
      var search = "foo~bar";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kvr(foo,bar);bbox;];"+
          "way[kvr(foo,bar);bbox;];"+
          "relation[kvr(foo,bar);bbox;];"+
        ");"+
        out_str
      );
    });
    /*// not regex key-value
    it("key!~value", function () {
      var search = "foo!~bar";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kvr(foo,not,bar);bbox;];"+
          "way[kvr(foo,not,bar);bbox;];"+
          "relation[kvr(foo,not,bar);bbox;];"+
        ");"+
        out_str
      );
    });*/
  });

  // data types
  describe("data types", function () {
    // strings
    it("strings", function () {
      // doulbe-quoted string
      search = "\"foo bar\"=*";
      result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(foo bar);bbox;];"+
          "way[kv(foo bar);bbox;];"+
          "relation[kv(foo bar);bbox;];"+
        ");"+
        out_str
      );
      search = "asd=\"foo bar\"";
      result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(asd,foo bar);bbox;];"+
          "way[kv(asd,foo bar);bbox;];"+
          "relation[kv(asd,foo bar);bbox;];"+
        ");"+
        out_str
      );
      // single-quoted string
      search = "'foo bar'='asd fasd'";
      result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(foo bar,asd fasd);bbox;];"+
          "way[kv(foo bar,asd fasd);bbox;];"+
          "relation[kv(foo bar,asd fasd);bbox;];"+
        ");"+
        out_str
      );
    });
  });

  // boolean logic
  describe("boolean logic", function () {
    // logical and
    it("logical and", function () {
      var search = "foo=bar and asd=fasd";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(foo,bar);kv(asd,fasd);bbox;];"+
          "way[kv(foo,bar);kv(asd,fasd);bbox;];"+
          "relation[kv(foo,bar);kv(asd,fasd);bbox;];"+
        ");"+
        out_str
      );
    });
    // logical or
    it("logical or", function () {
      var search = "foo=bar or asd=fasd";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(foo,bar);bbox;];"+
          "way[kv(foo,bar);bbox;];"+
          "relation[kv(foo,bar);bbox;];"+
          "node[kv(asd,fasd);bbox;];"+
          "way[kv(asd,fasd);bbox;];"+
          "relation[kv(asd,fasd);bbox;];"+
        ");"+
        out_str
      );
    });
    // boolean expression
    it("boolean expression", function () {
      var search = "(foo=* or bar=*) and (asd=* or fasd=*)";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(foo);kv(asd);bbox;];"+
          "way[kv(foo);kv(asd);bbox;];"+
          "relation[kv(foo);kv(asd);bbox;];"+
          "node[kv(foo);kv(fasd);bbox;];"+
          "way[kv(foo);kv(fasd);bbox;];"+
          "relation[kv(foo);kv(fasd);bbox;];"+
          "node[kv(bar);kv(asd);bbox;];"+
          "way[kv(bar);kv(asd);bbox;];"+
          "relation[kv(bar);kv(asd);bbox;];"+
          "node[kv(bar);kv(fasd);bbox;];"+
          "way[kv(bar);kv(fasd);bbox;];"+
          "relation[kv(bar);kv(fasd);bbox;];"+
        ");"+
        out_str
      );
    });
  });

  // meta conditions
  describe("meta conditions", function () {
    // type
    it("type", function () {
      // simple
      var search = "foo=bar and type:node";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(foo,bar);bbox;];"+
        ");"+
        out_str
      );
      // multiple types
      search = "foo=bar and (type:node or type:way)";
      result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(foo,bar);bbox;];"+
          "way[kv(foo,bar);bbox;];"+
        ");"+
        out_str
      );
      // excluding types
      search = "foo=bar and type:node and type:way";
      result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
        ");"+
        out_str
      );
    });
    // newer
    it("newer", function () {
      // regular
      var search = "newer:\"2000-01-01T01:01:01Z\" and type:node";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[newer(2000-01-01T01:01:01Z);bbox;];"+
        ");"+
        out_str
      );
      // relative
      search = "newer:1day and type:node";
      result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[newer({{date:1day}});bbox;];"+
        ");"+
        out_str
      );
    });
    // todo: more meta searches: id, ...?
  });

  // search-regions
  describe("regions", function () {

    var ffs;
    before(function() {
      ffs = turbo.ffs();
    });

    // global
    it("global", function () {
      var search = "foo=bar and type:node global";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[kv(foo,bar);];"+
        ");"+
        out_str
      );
    });
    // bbox
    it("in bbox", function () {
      // implicit
      var search = "type:node";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[bbox;];"+
        ");"+
        out_str
      );
      /*todo
      // explicit
      search = "type:node in bbox";
      result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "("+
          "node[bbox;];"+
        ");"+
        out_str
      );*/
    });
    // area
    it("in area", function () {
      var search = "type:node in foobar";
      var result = ffs.construct_query(search);
      expect(compact(result)).to.equal(
        "areaid(foobar);"+
        "("+
          "node[area;];"+
        ");"+
        out_str
      );
    });
    // todo: around

  });
});

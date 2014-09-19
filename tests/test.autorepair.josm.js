describe("ide.autorepair.josm", function () {
  // repair non-xml output data format: xml query
  it("repair non-xml output data format (xml query)", function () {
    var examples = [
      { // basic case
        inp: '<osm-script output="json"></osm-script>',
        outp: '<osm-script output="xml"><!-- fixed by auto repair --></osm-script>'
      },
      { // preserve other osm-script parameters
        inp: '<osm-script output="json" timeout="25"></osm-script>',
        outp: '<osm-script output="xml" timeout="25"><!-- fixed by auto repair --></osm-script>'
      },
      { // more complex real world example
        inp: '<osm-script output="json">\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="meta" order="quadtile"/>\n</osm-script>',
        outp: '<osm-script output="xml"><!-- fixed by auto repair -->\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="meta" order="quadtile"/>\n</osm-script>'
      },
    ];
    sinon.stub(ide,"getQueryLang").returns("xml");
    var setQuery = sinon.stub(ide,"setQuery");
    for (var i=0; i<examples.length; i++) {
      sinon.stub(ide,"getRawQuery").returns(examples[i].inp);
      ide.repairQuery("xml+metadata");
      var repaired_query = setQuery.getCall(i).args[0];
      expect(repaired_query).to.be.eql(examples[i].outp);
      ide.getRawQuery.restore();
    }
    ide.getQueryLang.restore();
    ide.setQuery.restore();
  });

  // repair non-xml output data format: ql query
  it("repair non-xml output data format (OverpassQL query)", function () {
    var examples = [
      { // basic case
        inp: '[out:json];',
        outp: '[out:xml];/*fixed by auto repair*/'
      },
      { // preserve whitespace
        inp: '  [ out : json ]\n;',
        outp: '  [ out : xml ]\n;/*fixed by auto repair*/'
      },
      { // preserve other osm-script parameters
        inp: '[out:json][timeout:25];',
        outp: '[out:xml]/*fixed by auto repair*/[timeout:25];'
      },
      { // more complex real world example
        inp: '/*bla*/\n[out:json];\nway\n  ["amenity"]\n  ({{bbox}})\n->.foo;\n.foo out meta qt;',
        outp: '/*bla*/\n[out:xml];/*fixed by auto repair*/\nway\n  ["amenity"]\n  ({{bbox}})\n->.foo;\n.foo out meta qt;'
      },
    ];
    sinon.stub(ide,"getQueryLang").returns("OverpassQL");
    var setQuery = sinon.stub(ide,"setQuery");
    for (var i=0; i<examples.length; i++) {
      sinon.stub(ide,"getRawQuery").returns(examples[i].inp);
      ide.repairQuery("xml+metadata");
      var repaired_query = setQuery.getCall(i).args[0];
      expect(repaired_query).to.be.eql(examples[i].outp);
      ide.getRawQuery.restore();
    }
    ide.getQueryLang.restore();
    ide.setQuery.restore();
  });

  // repair missing xml+meta infomation: xml query
  it("repair missing meta information (xml query)", function () {
    var examples = [
      { // trivial case
        inp: '<print/>',
        outp: '<print mode="meta"/><!-- fixed by auto repair -->'
      },
      { // trivial case 2
        inp: '<osm-script output="xml"><print/></osm-script>',
        outp: '<osm-script output="xml"><print mode="meta"/><!-- fixed by auto repair --></osm-script>'
      },
      { // more complex real world example
        inp: '<osm-script output="xml">\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="body" order="quadtile"/>\n</osm-script>',
        outp: '<osm-script output="xml">\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="meta" order="quadtile"/><!-- fixed by auto repair -->\n</osm-script>'
      },
    ];
    sinon.stub(ide,"getQueryLang").returns("xml");
    var setQuery = sinon.stub(ide,"setQuery");
    for (var i=0; i<examples.length; i++) {
      sinon.stub(ide,"getRawQuery").returns(examples[i].inp);
      ide.repairQuery("xml+metadata");
      var repaired_query = setQuery.getCall(i).args[0];
      expect(repaired_query).to.be.eql(examples[i].outp);
      ide.getRawQuery.restore();
    }
    ide.getQueryLang.restore();
    ide.setQuery.restore();
  });

  // repair missing xml+meta infomation: ql query
  it("repair missing meta information (OverpassQL query)", function () {
    var examples = [
      { // trivial case
        inp: 'out;',
        outp: 'out meta;/*fixed by auto repair*/'
      },
      { // trivial case 2
        inp: '[out:xml];out;',
        outp: '[out:xml];out meta;/*fixed by auto repair*/'
      },
      { // more complex real world example
        inp: '/*bla*/\n[out:xml];\nway\n  ["amenity"]\n  ({{bbox}})\n->.foo;\n.foo out qt;',
        outp: '/*bla*/\n[out:xml];\nway\n  ["amenity"]\n  ({{bbox}})\n->.foo;\n.foo out meta qt;/*fixed by auto repair*/'
      },
    ];
    sinon.stub(ide,"getQueryLang").returns("OverpassQL");
    var setQuery = sinon.stub(ide,"setQuery");
    for (var i=0; i<examples.length; i++) {
      sinon.stub(ide,"getRawQuery").returns(examples[i].inp);
      ide.repairQuery("xml+metadata");
      var repaired_query = setQuery.getCall(i).args[0];
      expect(repaired_query).to.be.eql(examples[i].outp);
      ide.getRawQuery.restore();
    }
    ide.getQueryLang.restore();
    ide.setQuery.restore();
  });

  // do not repair statements in comments
  it("do not repair statements in comments (xml query)", function () {
    var examples = [
      { // <print> in xml comment
        inp: '<!--<print/>-->',
        outp: '<!--<print/>-->'
      },
      { // <osm-script> in xml comment
        inp: '<!--<osm-script>-->',
        outp: '<!--<osm-script>-->'
      },
    ];
    sinon.stub(ide,"getQueryLang").returns("xml");
    var setQuery = sinon.stub(ide,"setQuery");
    for (var i=0; i<examples.length; i++) {
      sinon.stub(ide,"getRawQuery").returns(examples[i].inp);
      ide.repairQuery("xml+metadata");
      var repaired_query = setQuery.getCall(i).args[0];
      expect(repaired_query).to.be.eql(examples[i].outp);
      ide.getRawQuery.restore();
    }
    ide.getQueryLang.restore();
    ide.setQuery.restore();
  });

  // do not repair statements in comments
  it("do not repair statements in comments (overpassQL query)", function () {
    var examples = [
      { // multiline comment
        inp: '/*out;*/',
        outp: '/*out;*/'
      },
      { // single line comment
        inp: '//out;\n',
        outp: '//out;\n'
      },
    ];
    sinon.stub(ide,"getQueryLang").returns("OverpassQL");
    var setQuery = sinon.stub(ide,"setQuery");
    for (var i=0; i<examples.length; i++) {
      sinon.stub(ide,"getRawQuery").returns(examples[i].inp);
      ide.repairQuery("xml+metadata");
      var repaired_query = setQuery.getCall(i).args[0];
      expect(repaired_query).to.be.eql(examples[i].outp);
      ide.getRawQuery.restore();
    }
    ide.getQueryLang.restore();
    ide.setQuery.restore();
  });

});

describe("ide.autorepair.josm", function () {
  // repair missing xml+meta infomation: xml query
  it("repair xml query", function () {
    var examples = [
      { // trivial case
        inp: '<print/>',
        outp: '<print mode="meta"/><!-- fixed by auto repair -->'
      },
      { // trivial case 2
        inp: '<osm-script output="json"><print/></osm-script>',
        outp: '<osm-script output="xml"><!-- fixed by auto repair --><print mode="meta"/><!-- fixed by auto repair --></osm-script>'
      },
      { // more complex real world example
        inp: '<osm-script output="json">\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="body" order="quadtile"/>\n</osm-script>',
        outp: '<osm-script output="xml"><!-- fixed by auto repair -->\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query {{bbox}}/>\n  </query>\n  <print mode="meta" order="quadtile"/><!-- fixed by auto repair -->\n</osm-script>'
      },
    ];
    sinon.stub(ide,"getQueryLang").returns("xml");
    var setQuery = sinon.stub(ide,"setQuery");
    for (var i=0; i<examples.length; i++) {
      sinon.stub(ide,"getQuery").returns(examples[i].inp);
      ide.repairQuery("xml+metadata");
      var repaired_query = setQuery.getCall(i).args[0];
      expect(repaired_query).to.be.eql(examples[i].outp);
      ide.getQuery.restore();
    }
    ide.getQueryLang.restore();
    ide.setQuery.restore();
  });

  // repair missing xml+meta infomation: xml query
  it("repair overpassQL query", function () {
    var examples = [
      { // trivial case
        inp: 'out;',
        outp: 'out meta;/*fixed by auto repair*/'
      },
      { // trivial case 2
        inp: '[out:json];out;',
        outp: '[out:xml];/*fixed by auto repair*/out meta;/*fixed by auto repair*/'
      },
      { // more complex real world example
        inp: '/*bla*/\n[out:json];\nway\n  ["amenity"]\n  ({{bbox}})\n->.foo;\n.foo out qt;',
        outp: '/*bla*/\n[out:xml];/*fixed by auto repair*/\nway\n  ["amenity"]\n  ({{bbox}})\n->.foo;\n.foo out meta qt;/*fixed by auto repair*/'
      },
    ];
    sinon.stub(ide,"getQueryLang").returns("OverpassQL");
    var setQuery = sinon.stub(ide,"setQuery");
    for (var i=0; i<examples.length; i++) {
      sinon.stub(ide,"getQuery").returns(examples[i].inp);
      ide.repairQuery("xml+metadata");
      var repaired_query = setQuery.getCall(i).args[0];
      expect(repaired_query).to.be.eql(examples[i].outp);
      ide.getQuery.restore();
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
      sinon.stub(ide,"getQuery").returns(examples[i].inp);
      ide.repairQuery("xml+metadata");
      var repaired_query = setQuery.getCall(i).args[0];
      expect(repaired_query).to.be.eql(examples[i].outp);
      ide.getQuery.restore();
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
      sinon.stub(ide,"getQuery").returns(examples[i].inp);
      ide.repairQuery("xml+metadata");
      var repaired_query = setQuery.getCall(i).args[0];
      expect(repaired_query).to.be.eql(examples[i].outp);
      ide.getQuery.restore();
    }
    ide.getQueryLang.restore();
    ide.setQuery.restore();
  });

});

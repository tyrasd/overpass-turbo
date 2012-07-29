examples = {
  "Drinking Water in bbox":  {
    "overpass": '<osm-script output="json">\n  <query type="node">\n    <has-kv k="amenity" v="drinking_water"/>\n    <bbox-query/>\n  </query>\n  <print mode="body" order="quadtile"/>\n</osm-script>',
  },
  "Drinking Water in bbox (overpass QL)":  {
    "overpass": '[out:json];\n(\n  node\n    ["amenity"="drinking_water"]\n    (bbox)\n);\nout body;',
  },
  "Platforms in Bolzano": {
    "overpass": '<osm-script output="json">\n'+
                '  <area-query ref="3600047207"/>\n'+
                '  <recurse type="node-way" />\n'+
                '  <query type="way">\n'+
                '    <item />\n'+
                '    <has-kv k="highway" v="platform"/>\n'+
                '  </query>\n'+
                '  <union>\n'+
                '    <item />\n'+
                '    <recurse type="down" />\n'+
                '  </union>\n'+
                '  <print mode="body" order="quadtile"/>\n'+
                '</osm-script>',
  },
  "Turn Restrictions in bbox": {
    "overpass": '<osm-script output="json">\n  <union into="r">\n    <query type="relation">\n      <bbox-query/>\n      <has-kv k="type" v="restriction"/>\n    </query>\n  </union>\n  <union>\n    <item set="r" />\n    <recurse type="relation-node" />\n  </union>\n  <query type="node">\n    <item />\n  </query>\n  <union>\n    <item />\n    <item set="r" />\n  </union>\n  <print mode="body" order="quadtile"/>\n</osm-script>',
  },
  "find and show ways with Straße misspelled": {
    "overpass": '<osm-script output="json">\n  <query type="way">\n    <has-kv k="highway"/>\n    <has-kv k="name" regv="[Ss]trasse"/>\n    <bbox-query/>\n  </query>\n  <union>\n    <item />\n    <recurse type="down" />\n  </union>\n  <print mode="body" order="quadtile"/>\n</osm-script>',
  },
}
examples_initial_example = "Drinking Water in bbox";

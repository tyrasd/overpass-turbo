describe("overpass.geojson", function () {
  // check overpass*2geoJSON methods
  it("overpassJSON2geoJSON: node", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type: "node",
          id:   1,
          lat:  1.234,
          lon:  4.321
        }
      ]
    };
    geojson = [
      {
        type: "FeatureCollection",
        features: []
      },
      {
        type: "FeatureCollection",
        features: []
      },
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "node",
              id: 1,
              tags: {},
              relations: [],
              meta: {}
            },
            geometry: {
              type: "Point",
              coordinates: [4.321, 1.234]
            }
          }
        ]
      }
    ];
    var result = overpass.overpassJSON2geoJSON(json);
    expect(result).to.eql(geojson);
  });
  it("overpassJSON2geoJSON: way", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:  "way",
          id:    1,
          nodes: [2,3,4]
        },
        {
          type: "node",
          id:   2,
          lat:  0.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   3,
          lat:  0.0,
          lon:  1.1
        },
        {
          type: "node",
          id:   4,
          lat:  0.1,
          lon:  1.2
        }
      ]
    };
    geojson = [
      {
        type: "FeatureCollection",
        features: []
      },
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "way",
              id: 1,
              tags: {},
              relations: [],
              meta: {}
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [1.0,0.0],
                [1.1,0.0],
                [1.2,0.1],
              ]
            }
          }
        ]
      },
      {
        type: "FeatureCollection",
        features: []
      }
    ];
    var result = overpass.overpassJSON2geoJSON(json);
    expect(result).to.eql(geojson);
  });
  it("overpassJSON2geoJSON: polygon", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:  "way",
          id:    1,
          nodes: [2,3,4,5,2],
          tags:  {area: "yes"}
        },
        {
          type: "node",
          id:   2,
          lat:  0.0,
          lon:  0.0
        },
        {
          type: "node",
          id:   3,
          lat:  0.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   4,
          lat:  1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   5,
          lat:  1.0,
          lon:  0.0
        }
      ]
    };
    geojson = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "way",
              id: 1,
              tags: {area: "yes"},
              relations: [],
              meta: {}
            },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [0.0,0.0],
                [1.0,0.0],
                [1.0,1.0],
                [0.0,1.0],
                [0.0,0.0],
              ]]
            }
          }
        ]
      },
      {
        type: "FeatureCollection",
        features: []
      },
      {
        type: "FeatureCollection",
        features: []
      }
    ];
    var result = overpass.overpassJSON2geoJSON(json);
    expect(result).to.eql(geojson);
  });
  it("overpassJSON2geoJSON: simple multipolygon", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:    "relation",
          id:      1,
          tags:    {"type":"multipolygon"},
          members: [
            {
              type: "way",
              ref:  2,
              role: "outer"
            },
            {
              type: "way",
              ref:  3,
              role: "inner"
            }
          ]
        },
        {
          type:  "way",
          id:    2,
          nodes: [4,5,6,7,4]
        },
        {
          type:  "way",
          id:    3,
          nodes: [8,9,10,8]
        },
        {
          type: "node",
          id:   4,
          lat: -1.0,
          lon: -1.0
        },
        {
          type: "node",
          id:   5,
          lat: -1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   6,
          lat:  1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   7,
          lat:  1.0,
          lon: -1.0
        },
        {
          type: "node",
          id:   8,
          lat: -0.5,
          lon:  0.0
        },
        {
          type: "node",
          id:   9,
          lat:  0.5,
          lon:  0.0
        },
        {
          type: "node",
          id:   10,
          lat:  0.0,
          lon:  0.5
        }
      ]
    };
    geojson = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "way",
              id: 2,
              tags: {},
              relations: [
                {
                  rel: 1,
                  role: "outer",
                  reltags: {"type":"multipolygon"}
                }
              ],
              meta: {}
            },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [-1.0,-1.0],
                [ 1.0,-1.0],
                [ 1.0, 1.0],
                [-1.0, 1.0],
                [-1.0,-1.0],
              ],[
                [0.0,-0.5],
                [0.0, 0.5],
                [0.5, 0.0],
                [0.0,-0.5]
              ]]
            }
          }
        ]
      },
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "way",
              id: 3,
              tags: {},
              relations: [
                {
                  rel: 1,
                  role: "inner",
                  reltags: {"type":"multipolygon"}
                }
              ],
              meta: {},
              mp_inner: true
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [0.0,-0.5],
                [0.0, 0.5],
                [0.5, 0.0],
                [0.0,-0.5]
              ]
            }
          }  
        ]
      },
      {
        type: "FeatureCollection",
        features: []
      }
    ];
    var result = overpass.overpassJSON2geoJSON(json);
    expect(result).to.eql(geojson);
  });
  // tainted geometries
  it("overpassJSON2geoJSON: tainted geometries", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:  "way",
          id:    10,
          nodes: [2,3,5]
        },
        {
          type:  "way",
          id:    11,
          nodes: [2,3,4,5,2],
          tags:  {"area":"yes"}
        },
        {
          type:  "way",
          id:    12,
          nodes: [2,3,4,2],
        },
        {
          type:    "relation",
          id:      100,
          tags:    {"type":"multipolygon"},
          members: [
            {
              type: "way",
              ref:  12,
              role: "outer"
            },
            {
              type: "way",
              ref:  13,
              role: "inner"
            }
          ]
        },
        {
          type: "node",
          id:   2,
          lat:  1.0,
          lon:  0.0
        },
        {
          type: "node",
          id:   3,
          lat:  0.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   4,
          lat:  1.0,
          lon:  1.0
        }
      ]
    };
    geojson = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "way",
              id: 12,
              tags: {},
              relations: [
                {
                  rel: 100,
                  role: "outer",
                  reltags: {"type":"multipolygon"}
                }
              ],
              meta: {},
              tainted: true
            },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [0.0,1.0],
                [1.0,0.0],
                [1.0,1.0],
                [0.0,1.0]
              ]]
            }
          },
          {
            type: "Feature",
            properties: {
              type: "way",
              id:   11,
              tags: {"area":"yes"},
              relations: [],
              meta: {},
              tainted: true
            },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [0.0,1.0],
                [1.0,0.0],
                [1.0,1.0],
                [0.0,1.0]
              ]]
            }
          }
        ]
      },
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "way",
              id: 10,
              tags: {},
              relations: [],
              meta: {},
              tainted: true
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [0.0,1.0],
                [1.0,0.0]
              ]
            }
          }
        ]
      },
      {
        type: "FeatureCollection",
        features: []
      }
    ];
    var result = overpass.overpassJSON2geoJSON(json);
    expect(result).to.eql(geojson);
  });
  // tags & pois
  it("overpassJSON2geoJSON: tags: ways and nodes / pois", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:  "way",
          id:    1,
          nodes: [2,3,4],
          tags:  {"foo":"bar"}
        },
        {
          type: "node",
          id:   2,
          lat:  0.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   3,
          lat:  0.0,
          lon:  1.1,
          tags: {"asd":"fasd"}
        },
        {
          type: "node",
          id:   4,
          lat:  0.1,
          lon:  1.2,
          tags: {"created_by":"me"}
        },
        {
          type: "node",
          id:   5,
          lat:  0.0,
          lon:  0.0
        }
      ]
    };
    geojson = [
      {
        type: "FeatureCollection",
        features: []
      },
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "way",
              id: 1,
              tags: {"foo":"bar"},
              relations: [],
              meta: {}
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [1.0,0.0],
                [1.1,0.0],
                [1.2,0.1],
              ]
            }
          }
        ]
      },
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "node",
              id: 3,
              tags: {"asd":"fasd"},
              relations: [],
              meta: {}
            },
            geometry: {
              type: "Point",
              coordinates: [1.1,0.0]
            }
          },
          {
            type: "Feature",
            properties: {
              type: "node",
              id: 5,
              tags: {},
              relations: [],
              meta: {}
            },
            geometry: {
              type: "Point",
              coordinates: [0.0,0.0]
            }
          }
        ]
      }
    ];
    var result = overpass.overpassJSON2geoJSON(json);
    expect(result).to.eql(geojson);
  });
  // relations
  it("overpassJSON2geoJSON: relations and id-spaces", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:  "way",
          id:    1,
          nodes: [1,2]
        },
        {
          type: "node",
          id:   1,
          lat:  1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   2,
          lat:  2.0,
          lon:  2.0
        },
        {
          type:    "relation",
          id:      1,
          tags:    {"foo":"bar"},
          members: [
            {
              type: "way",
              ref:  1,
              role: "asd"
            },
            {
              type: "node",
              ref:  1,
              role: "fasd"
            }
          ]
        }
      ]
    };
    geojson = [
      {
        type: "FeatureCollection",
        features: []
      },
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "way",
              id: 1,
              tags: {},
              relations: [
                {
                  rel: 1,
                  role: "asd",
                  reltags: {"foo":"bar"}
                }
              ],
              meta: {}
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [1.0,1.0],
                [2.0,2.0]
              ]
            }
          }
        ]
      },
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "node",
              id: 1,
              tags: {},
              relations: [
                {
                  rel: 1,
                  role: "fasd",
                  reltags: {"foo":"bar"}
                }
              ],
              meta: {}
            },
            geometry: {
              type: "Point",
              coordinates: [1.0,1.0]
            }
          }
        ]
      }
    ];
    var result = overpass.overpassJSON2geoJSON(json);
    expect(result).to.eql(geojson);
  });
  // meta info // todo +lines, +polygons
  it("overpassJSON2geoJSON: meta data", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type: "node",
          id:   1,
          lat:  1.234,
          lon:  4.321,
          timestamp: "2013-01-13T22:56:07Z",
          version:   7,
          changeset: 1234,
          user:      "johndoe",
          uid:       666
        }
      ]
    };
    geojson = [
      {
        type: "FeatureCollection",
        features: []
      },
      {
        type: "FeatureCollection",
        features: []
      },
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              type: "node",
              id: 1,
              tags: {},
              relations: [],
              meta: {
                timestamp: "2013-01-13T22:56:07Z",
                version:   7,
                changeset: 1234,
                user:      "johndoe",
                uid:       666
              }
            },
            geometry: {
              type: "Point",
              coordinates: [4.321, 1.234]
            }
          }
        ]
      }
    ];
    var result = overpass.overpassJSON2geoJSON(json);
    expect(result).to.eql(geojson);
  });

});

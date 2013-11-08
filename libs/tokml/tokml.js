!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.tokml=e():"undefined"!=typeof global?global.tokml=e():"undefined"!=typeof self&&(self.tokml=e())}(function(){var define,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function tokml(geojson, options) {

    options = options || {
        documentName: undefined,
        documentDescription: undefined,
        name: 'name',
        description: 'description',
    };

    return '<?xml version="1.0" encoding="UTF-8"?>' +
        tag('kml',
            tag('Document',
                documentName(options) +
                documentDescription(options) +
                root(geojson, options)
               ), [['xmlns', 'http://www.opengis.net/kml/2.2']]);
};

function feature(options) {
    return function(_) {
        return tag('Placemark',
            name(_.properties, options) +
            description(_.properties, options) +
            geometry.any(_.geometry) +
            extendeddata(_.properties));
    };
}

function root(_, options) {
    if (!_.type) return '';
    switch (_.type) {
        case 'FeatureCollection': return _.features.map(feature(options)).join('');
        case 'Feature': return feature(options)(_);
        default:
            if (_.type in geometry) {
                return feature(options)({
                    type: 'Feature',
                    geometry: _,
                    properties: {}
                });
            }
    }
    return '';
}

function documentName(options) {
    return (options.documentName !== undefined) ? tag('name', options.documentName) : '';
}

function documentDescription(options) {
    return (options.documentDescription !== undefined) ? tag('description', options.documentDescription) : '';
}

function name(_, options) {
    return (_[options.name]) ? tag('name', encode(_[options.name])) : '';
}

function description(_, options) {
    return (_[options.description]) ? tag('description', encode(_[options.description])) : '';
}

// ## Geometry Types
//
// https://developers.google.com/kml/documentation/kmlreference#geometry
var geometry = {
    Point: function(_) {
        return tag('Point', tag('coordinates', _.coordinates.join(',')));
    },
    LineString: function(_) {
        return tag('LineString', tag('coordinates', linearring(_.coordinates)));
    },
    Polygon: function(_) {
        var outer = _.coordinates[0],
            inner = _.coordinates.slice(1),
            outerRing = tag('outerBoundaryIs',
                tag('LinearRing', tag('coordinates', linearring(outer)))),
            innerRings = inner.map(function(i) {
                return tag('innerBoundaryIs',
                    tag('LinearRing', tag('coordinates', linearring(i))));
            }).join('');
        return tag('Polygon', outerRing + innerRings);
    },
    MultiPoint: function(_) {
        return tag('MultiGeometry', _.coordinates.map(function(c) {
            return geometry.Point({ coordinates: c });
        }).join(''));
    },
    MultiPolygon: function(_) {
        return tag('MultiGeometry', _.coordinates.map(function(c) {
            return geometry.Polygon({ coordinates: c });
        }).join(''));
    },
    MultiLineString: function(_) {
        return tag('MultiGeometry', _.coordinates.map(function(c) {
            return geometry.LineString({ coordinates: c });
        }).join(''));
    },
    GeometryCollection: function(_) {
        return tag('MultiGeometry',
            _.geometries.map(geometry.any).join(''));
    },
    any: function(_) {
        if (geometry[_.type]) {
            return geometry[_.type](_);
        } else {
            return '';
        }
    }
};

function linearring(_) {
    return _.map(function(cds) { return cds.join(','); }).join(' ');
}

// ## Data
function extendeddata(_) {
    return tag('ExtendedData', pairs(_).map(data).join(''));
}

function data(_) {
    return tag('Data', encode(_[1]), [['name', encode(_[0])]]);
}

// ## Helpers
function pairs(_) {
    var o = [];
    for (var i in _) o.push([i, _[i]]);
    return o;
}

function attr(_) {
    return _ ? (' ' + _.map(function(a) {
        return a[0] + '="' + a[1] + '"';
    }).join(' ')) : '';
}

function tag(el, contents, attributes) {
    return '<' + el + attr(attributes) + '>' + contents + '</' + el + '>';
}


function encode(_) {
    return (_ || '').replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

},{}]},{},[1])
(1)
});
;
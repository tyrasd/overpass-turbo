// Polyfill for the Math.sign function, only available in some browsers
Math.sign = Math.sign || function(x) {return (x < 0) ? -1 : ((x > 0) ? 1 : 0); }

L.PolylineOffset = {
  translatePoint: function(pt, dist, radians) {
    // Y coordinates expand downward, hence the minus
    return L.point(pt.x + dist * Math.cos(radians), pt.y - dist * Math.sin(radians));
  },

  /**
  Computes the angle of the vecteur a->b
  as a radian angle between -Pi and Pi.
  */
  radianAngle: function(a, b) {
    // vertical
    if (a.x == b.x) {
      return Math.sign(a.y - b.y) * Math.PI / 2;  // Inverted Y coords
    }
    // horizontal
    if (a.y == b.y) {
      return (a.x < b.x) ? 0 : Math.PI;
    }
    // general case
    return Math.sign(a.y - b.y) * Math.atan2(Math.abs(b.y - a.y), b.x - a.x);
  },

  offsetPointLine: function(points, distance) {
    var l = points.length;
    if (l < 2)
      throw new Error('Line should be defined by at least 2 points');

    var a = points[0], b;
    var segmentAngle;
    var deltaAngle = -Math.PI / 2,
        offsetAngle;
    var offsetSegments = [];

    for(var i=1; i < l; i++) {
      b = points[i];
      segmentAngle = this.radianAngle(a, b);
      offsetAngle = this._normalizeAngle(segmentAngle + deltaAngle);

      // store offset point and other information to avoid recomputing it later
      offsetSegments.push({
        angle: segmentAngle,
        offsetAngle: offsetAngle,
        distance: distance,
        original: [a, b],
        offset: [
          this.translatePoint(a, distance, offsetAngle),
          this.translatePoint(b, distance, offsetAngle)
        ]
      });
      a = b;
    }

    return offsetSegments;
  },

  latLngsToPoints: function(ll, map) {
    var pts = [];
    for(var i=0, l=ll.length; i<l; i++) {
      pts[i] = map.project(ll[i]);
    }
    return pts;
  },  

  pointsToLatLngs: function(pts, map) {
    var ll = [];
    for(var i=0, l=pts.length; i<l; i++) {
      ll[i] = map.unproject(pts[i]);
    }
    return ll;
  },

  offsetLatLngs: function(ll, offset, map) {
    var offsetPoints = this.offsetLatLngsToPoints(ll, offset, map);
    return this.pointsToLatLngs(offsetPoints, map);
  },

  offsetLatLngsToPoints: function(ll, offset, map) {
    var origPoints = this.latLngsToPoints(ll, map);
    return this.offsetPoints(origPoints, offset);
  },

  offsetPoints: function(pts, offset) {
    var offsetSegments = this.offsetPointLine(pts, offset);
    return this.joinLineSegments(offsetSegments, offset, 'round');
  },

  /**
  Return the intersection point of two lines defined by two points each
  */
  intersection: function(l1a, l1b, l2a, l2b) {
    var line1 = this.lineEquation(l1a, l1b),
        line2 = this.lineEquation(l2a, l2b);

    if(line1.hasOwnProperty('x')) {
      return L.point(line1.x, line2.a * line1.x + line2.b);
    }
    if(line2.hasOwnProperty('x')) {
      return L.point(line2.x, line1.a * line2.x + line1.b);
    }

    var x = (line2.b - line1.b) / (line1.a - line2.a),
        y = line1.a * x + line1.b;

    return L.point(x, y);
  },

  /**
  Find the coefficients (a,b) of a line of equation y = a.x + b,
  or the constant x for vertical lines
  */
  lineEquation: function(pt1, pt2) {
    if (pt1.x == pt2.x) {
      return {
        x: pt1.x
      }
    }

    var a = (pt2.y - pt1.y) / (pt2.x - pt1.x),
        b = pt1.y - a * pt1.x;

    return {
      a: a,
      b: b
    }
  },

  /**
  Normalize a radian angle so it's expressed between (-Pi; Pi).
  */
  _normalizeAngle: function(rad) {
    // TODO: find a better way (?)
    rad += Math.PI;
    var pipi = 2 * Math.PI;

    while(rad > pipi) {
      rad = rad - pipi;
    }

    while(rad < 0) {
      rad = rad + pipi;
    }

    return rad - Math.PI;
  },

  /**
  Join 2 line segments defined by 2 points each,
  with a specified methodnormalizeAngle( (default : intersection);
  */
  joinSegments: function(s1, s2, offset, joinStyle) {
    var jointPoints;
    // for inward joints, just intersect
    if((Math.sign(this._normalizeAngle(s2.offsetAngle - s1.offsetAngle)) != Math.sign(offset))) {
      joinStyle = 'intersection';
    }
    switch(joinStyle) {
      case 'round':
        jointPoints = this.circularArc(s1.original[1], s1.distance, s1.offsetAngle, s2.offsetAngle, (offset > 0));
        break;
      case 'cut':
        jointPoints = [
          this.intersection(s1.offset[0], s1.offset[1], s2.original[0], s2.original[1]),
          this.intersection(s1.original[0], s1.original[1], s2.offset[0], s2.offset[1])
        ];
        break;
      case 'straight':
        jointPoints = [s1.offset[1], s2.offset[0]];
        break;
      case 'intersection':
      default:
        jointPoints = [this.intersection(s1.offset[0], s1.offset[1], s2.offset[0], s2.offset[1])];
    }
    return jointPoints;
  },

  joinLineSegments: function(segments, offset, joinStyle) {
    var l = segments.length;
    var joinedPoints = [];
    var s1 = segments[0], s2 = segments[0];
    joinedPoints.push(s1.offset[0]);
    
    for(var i=1; i<l; i++) {
      s2 = segments[i];
      joinedPoints = joinedPoints.concat(this.joinSegments(s1, s2, offset, joinStyle));
      s1 = s2;
    }
    joinedPoints.push(s2.offset[1]);

    return joinedPoints;
  },

  /**
  Interpolates points on a circular arc given a center,
  two angles, and a direction of rotation
  */
  circularArc: function(center, radius, startAngle, endAngle, trigoDir, angleInc) {
      var points = [];
      var angleInc = angleInc || Math.PI / 16;

      // negative order of rotation
      if(!trigoDir) {
        angleInc = -angleInc;
      }

      // TODO: fix so that the first and final angles are equal
      for(var alpha = startAngle; true; ) {
        points.push(this.translatePoint(center, radius, alpha));
        alpha = this._normalizeAngle(alpha + angleInc);
        if(Math.abs(alpha - endAngle) < Math.abs(angleInc)) {
          break;
        }
      }

      return points;
  }
}

// Modify the L.Polyline class by overwriting the projection function,
// to add offset related code 
// Versions < 0.8
if(L.version.charAt(0) == '0' && parseInt(L.version.charAt(2)) < 8) {
  L.Polyline.include({
    projectLatlngs: function() {
      this._originalPoints = [];

      for (var i = 0, len = this._latlngs.length; i < len; i++) {
        this._originalPoints[i] = this._map.latLngToLayerPoint(this._latlngs[i]);
      }
      // Offset management hack ---
      if(this.options.offset) {
        this._originalPoints = L.PolylineOffset.offsetPoints(this._originalPoints, this.options.offset);
      }
      // Offset management hack END ---
    }
  });
} else {
// Versions >= 0.8
  L.Polyline.include({
    _projectLatlngs: function (latlngs, result) {
      var flat = latlngs[0] instanceof L.LatLng,
          len = latlngs.length,
          i, ring;

      if (flat) {
        ring = [];
        for (i = 0; i < len; i++) {
          ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
        }
        // Offset management hack ---
        if(this.options.offset) {
          ring = L.PolylineOffset.offsetPoints(ring, this.options.offset);
        }
        // Offset management hack END ---
        result.push(ring);
      } else {
        for (i = 0; i < len; i++) {
          this._projectLatlngs(latlngs[i], result);
        }
      }
    }
  });
}

L.Polyline.include({
  setOffset: function(offset) {
    this.options.offset = offset;
    this.redraw();
    return this;
  }
});

/**
 * @author bbecquet
 * @license MIT
 * @see github.com/bbecquet/Leaflet.PolylineOffset
 */

function forEachPair(list, callback) {
  if (!list || list.length < 1) {
    return;
  }
  for (let i = 1, l = list.length; i < l; i++) {
    callback(list[i - 1], list[i]);
  }
}

/**
Find the coefficients (a,b) of a line of equation y = a.x + b,
or the constant x for vertical lines
Return null if there's no equation possible
*/
function lineEquation(pt1, pt2) {
  if (pt1.x === pt2.x) {
    return pt1.y === pt2.y ? null : {x: pt1.x};
  }

  const a = (pt2.y - pt1.y) / (pt2.x - pt1.x);
  return {
    a: a,
    b: pt1.y - a * pt1.x
  };
}

/**
Return the intersection point of two lines defined by two points each
Return null when there's no unique intersection
*/
function intersection(l1a, l1b, l2a, l2b) {
  const line1 = lineEquation(l1a, l1b);
  const line2 = lineEquation(l2a, l2b);

  if (line1 === null || line2 === null) {
    return null;
  }

  // eslint-disable-next-line no-prototype-builtins
  if (line1.hasOwnProperty("x")) {
    // eslint-disable-next-line no-prototype-builtins
    return line2.hasOwnProperty("x")
      ? null
      : {
          x: line1.x,
          y: line2.a * line1.x + line2.b
        };
  }
  // eslint-disable-next-line no-prototype-builtins
  if (line2.hasOwnProperty("x")) {
    return {
      x: line2.x,
      y: line1.a * line2.x + line1.b
    };
  }

  if (line1.a === line2.a) {
    return null;
  }

  const x = (line2.b - line1.b) / (line1.a - line2.a);
  return {
    x: x,
    y: line1.a * x + line1.b
  };
}

function translatePoint(pt, dist, heading) {
  return {
    x: pt.x + dist * Math.cos(heading),
    y: pt.y + dist * Math.sin(heading)
  };
}

const PolylineOffset = {
  offsetPointLine: function (points, distance) {
    const offsetSegments = [];

    forEachPair(
      points,
      L.bind((a, b) => {
        if (a.x === b.x && a.y === b.y) {
          return;
        }

        // angles in (-PI, PI]
        const segmentAngle = Math.atan2(a.y - b.y, a.x - b.x);
        const offsetAngle = segmentAngle - Math.PI / 2;

        offsetSegments.push({
          offsetAngle: offsetAngle,
          original: [a, b],
          offset: [
            translatePoint(a, distance, offsetAngle),
            translatePoint(b, distance, offsetAngle)
          ]
        });
      }, this)
    );

    return offsetSegments;
  },

  offsetPoints: function (pts, options) {
    const offsetSegments = this.offsetPointLine(
      L.LineUtil.simplify(pts, options.smoothFactor),
      options.offset
    );
    return this.joinLineSegments(offsetSegments, options.offset);
  },

  /**
    Join 2 line segments defined by 2 points each with a circular arc
    */
  joinSegments: function (s1, s2, offset) {
    // TODO: different join styles
    return this.circularArc(s1, s2, offset).filter((x) => x);
  },

  joinLineSegments: function (segments, offset) {
    let joinedPoints = [];
    const first = segments[0];
    const last = segments[segments.length - 1];

    if (first && last) {
      joinedPoints.push(first.offset[0]);
      forEachPair(
        segments,
        L.bind(function (s1, s2) {
          joinedPoints = joinedPoints.concat(this.joinSegments(s1, s2, offset));
        }, this)
      );
      joinedPoints.push(last.offset[1]);
    }

    return joinedPoints;
  },

  segmentAsVector: function (s) {
    return {
      x: s[1].x - s[0].x,
      y: s[1].y - s[0].y
    };
  },

  getSignedAngle: function (s1, s2) {
    const a = this.segmentAsVector(s1);
    const b = this.segmentAsVector(s2);
    return Math.atan2(a.x * b.y - a.y * b.x, a.x * b.x + a.y * b.y);
  },

  /**
    Interpolates points between two offset segments in a circular form
    */
  circularArc: function (s1, s2, distance) {
    // if the segments are the same angle,
    // there should be a single join point
    if (s1.offsetAngle === s2.offsetAngle) {
      return [s1.offset[1]];
    }

    const signedAngle = this.getSignedAngle(s1.offset, s2.offset);
    // for inner angles, just find the offset segments intersection
    if (
      signedAngle * distance > 0 &&
      signedAngle *
        this.getSignedAngle(s1.offset, [s1.offset[0], s2.offset[1]]) >
        0
    ) {
      return [
        intersection(s1.offset[0], s1.offset[1], s2.offset[0], s2.offset[1])
      ];
    }

    // draws a circular arc with R = offset distance, C = original meeting point
    const points = [];
    const center = s1.original[1];
    // ensure angles go in the anti-clockwise direction
    const rightOffset = distance > 0;
    const startAngle = rightOffset ? s2.offsetAngle : s1.offsetAngle;
    let endAngle = rightOffset ? s1.offsetAngle : s2.offsetAngle;
    // and that the end angle is bigger than the start angle
    if (endAngle < startAngle) {
      endAngle += Math.PI * 2;
    }
    const step = Math.PI / 8;
    for (let alpha = startAngle; alpha < endAngle; alpha += step) {
      points.push(translatePoint(center, distance, alpha));
    }
    points.push(translatePoint(center, distance, endAngle));

    return rightOffset ? points.reverse() : points;
  }
};

// Modify the L.Polyline class by overwriting the projection function
L.Polyline.include({
  _projectLatlngs: function (latlngs, result, projectedBounds) {
    const isFlat = latlngs.length > 0 && latlngs[0] instanceof L.LatLng;

    if (isFlat) {
      let ring = latlngs.map(
        L.bind(function (ll) {
          const point = this._map.latLngToLayerPoint(ll);
          if (projectedBounds) {
            projectedBounds.extend(point);
          }
          return point;
        }, this)
      );

      // Offset management hack ---
      if (this.options.offset) {
        ring = PolylineOffset.offsetPoints(ring, this.options);
      }
      // Offset management hack END ---

      result.push(ring.map((xy) => L.point(xy.x, xy.y)));
    } else {
      latlngs.forEach(
        L.bind(function (ll) {
          this._projectLatlngs(ll, result, projectedBounds);
        }, this)
      );
    }
  }
});

L.Polyline.include({
  setOffset: function (offset) {
    this.options.offset = offset;
    this.redraw();
    return this;
  }
});

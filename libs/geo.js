function PointInPolygon(p,Q) {
  var CrossProdTest = function(a,b,c) {
    var A = a.slice(), B=b.slice(), C=c.slice(); // todo: really necessary
    if (A[1] == B[2] && B[2] == C[2])
      if ((B[0] <= A[0] && A[0] <= C[0]) || (C[0] <= A[0] && A[0] <= B[0]))
        return 0;
      else
        return +1;
    if (B[1] > C[1]) {
      var dummy = C; C = B; B = dummy;
    }
    if (A[1] == B[1] && A[0] == B[0])
      return 0;
    if (A[1] <= B[1] || A[1] > C[1])
      return +1;
    var delta = (B[0] - A[0])*(C[1] - A[1]) - (B[1] - A[1])*(C[0] - A[0]);
    if (delta > 0)
      return -1;
    else if (delta < 0)
      return +1;
    else
      return 0;
  };
  t = -1;
  var P = p.slice();
  P.push(P[0]);
  for (var i=0;i<P.length-1;i++)
    t *= CrossProdTest(Q,P[i],P[i+1]);
  return t;
}

L.Polygon.prototype.getCenter = function() {
  var pts = this._latlngs;
  var off = pts[0];
  var twicearea = 0;
  var x = 0;
  var y = 0;
  var nPts = pts.length;
  var p1,p2;
  var f;
  for (var i = 0, j = nPts - 1; i < nPts; j = i++) {
    p1 = pts[i];
    p2 = pts[j];
    f = (p1.lat - off.lat) * (p2.lng - off.lng) - (p2.lat - off.lat) * (p1.lng - off.lng);
    twicearea += f;
    x += (p1.lat + p2.lat - 2 * off.lat) * f;
    y += (p1.lng + p2.lng - 2 * off.lng) * f;
  }
  f = twicearea * 3;
  return new L.LatLng(
    lat: x / f + off.lat,
    lng: y / f + off.lng
  );
}

function dist(la1,lo1,la2,lo2) {
  var R = 6367500;
  var DTR = Math.PI/180;
  return R*DTR*Math.sqrt( Math.pow(la1-la2,2) + Math.pow(Math.cos(DTR*la1)*(lo1-lo2),2) ); 
}

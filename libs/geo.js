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

function polygonCenter(pts) {
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
    f = (p1[1] - off[1]) * (p2[0] - off[0]) - (p2[1] - off[1]) * (p1[0] - off[0]);
    twicearea += f;
    x += (p1[1] + p2[1] - 2 * off[1]) * f;
    y += (p1[0] + p2[0] - 2 * off[0]) * f;
  }
  f = twicearea * 3;
  return [
    y / f + off[0],
    x / f + off[1]
  ];
}
function polygonArea(pts) {
  var off = pts[0];
  var A = 0;
  for (var i=0; i<pts.length-1; i++)
    A += (pts[i][1] - off[1]) * (pts[i+1][0] - off[0]) - (pts[i+1][1] - off[1]) * (pts[i][0] - off[0]);
    //A+=pts[i][0]*pts[i+1][1]-pts[i+1][0]*pts[i][1];
  return A/2;
}

function dist(la1,lo1,la2,lo2) {
  var R = 6367500;
  var DTR = Math.PI/180;
  return R*DTR*Math.sqrt( Math.pow(la1-la2,2) + Math.pow(Math.cos(DTR*la1)*(lo1-lo2),2) ); 
}

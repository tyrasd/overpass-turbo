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

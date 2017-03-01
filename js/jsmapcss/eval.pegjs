

Expression
  = op1:Operand _ op:("==" / "!=" / "<>" / ">=" / ">" / "<=" / "<" / "eq" / "ne" / "&&" / "||") _ op2:Expression {
      switch (op) {
      case "==":
        return ""+(isNaN(+op1) || isNaN(+op2) ? op1 == op2 : +op1 == +op2);
      case "!=":
      case "<>":
        return ""+(isNaN(+op1) || isNaN(+op2) ? op1 != op2 : +op1 != +op2);
      case ">":
        return ""+(isNaN(+op1) || isNaN(+op2) ? op1 >  op2 : +op1 >  +op2);
      case ">=":
        return ""+(isNaN(+op1) || isNaN(+op2) ? op1 >= op2 : +op1 >= +op2);
      case "<":
        return ""+(isNaN(+op1) || isNaN(+op2) ? op1 <  op2 : +op1 <  +op2);
      case "<=":
        return ""+(isNaN(+op1) || isNaN(+op2) ? op1 <= op2 : +op1 <= +op2);
      case "eq":
        return ""+(op1 === op2);
      case "ne":
        return ""+(op1 !== op2);
      case "&&":
        return ""+(["false", "no", "0", 0, ""].indexOf(op1) < 0 && ["false", "no", "0", 0, ""].indexOf(op2) < 0);
      case "||":
        return ""+(["false", "no", "0", 0, ""].indexOf(op1) < 0 || ["false", "no", "0", 0, ""].indexOf(op2) < 0);
      }
    }
  / Operand

Operand
  = head:Term tail:(_ ("." / "+" / "-") _ Term)* {
      var result = head, i;

      for (i = 0; i < tail.length; i++) {
        if (tail[i][1] === ".") { result = ""+(result + tail[i][3]); }
        if (tail[i][1] === "+") { result = ""+(+result + +tail[i][3]); }
        if (tail[i][1] === "-") { result = ""+(result-tail[i][3]); }
      }

      return result;
    }

Term
  = head:Factor tail:(_ ("*" / "/") _ Factor)* {
      var result = head, i;

      for (i = 0; i < tail.length; i++) {
        if (tail[i][1] === "*") { result = ""+(result * tail[i][3]); }
        if (tail[i][1] === "/") { result = ""+(result / tail[i][3]); }
      }

      return result;
    }

Factor
  = "!" _ expr:Expression { return ["false", "no", "0", 0, ""].indexOf(expr) >= 0 ? "true" : "false" }
  / fun:("num" / "str" / "boolean" / "int" / "sqrt" / "tag") "(" _ expr:Expression _ ")" {
      switch (fun) {
      case "num":
        return ""+(parseFloat(expr) || "");
      case "str":
        return ""+expr;
      case "boolean":
        return ["false", "no", "0", 0, ""].indexOf(expr) >= 0 ? "false" : "true";
      case "int":
        return ""+(expr < 0 ? Math.ceil(expr) : Math.floor(expr));
      case "sqrt":
        return ""+Math.sqrt(expr);
      case "tag":
        return module.exports.tag(expr);
      }
    }
  / "cond(" _ exprCond:Expression _ "," _ exprTrue:Expression _ "," _ exprFalse:Expression _ ")" { return ["false", "no", "0", 0, ""].indexOf(exprCond) < 0 ? exprTrue : exprFalse }
  / fun:("max" / "min" / "concat" / "any") "(" _ head:Expression tail:(_ "," _ Expression)* _ ")" {
      switch (fun) {
      case "max":
        return ""+tail.reduce(function(acc,val) { return Math.max(+acc,+val[3]); }, +head);
      case "min":
        return ""+tail.reduce(function(acc,val) { return Math.min(+acc,+val[3]); }, +head);
      case "concat":
        return tail.reduce(function(acc,val) { return acc+val[3]; }, ""+head);
      case "any":
        return tail.reduce(function(acc,val) { return acc || val[3]; }, head);
      }
    }
  / "(" _ expr:Expression _ ")" { return expr; }
  / String

String "string"
  = "none" { return "" }
  / "-"? [0-9]+ ("." [0-9]+)? ("E" "-"? [0-9]+)? { return ""+parseFloat(text()); }
  / '"' s:[^"]* '"' { return s.join(''); }
  / "'" s:[^']* "'" { return s.join(''); }

_ "whitespace"
  = [ \t\n\r]*

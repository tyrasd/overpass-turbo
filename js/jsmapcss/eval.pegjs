

Expression
  = op1:Operator _ "==" _ op2:Expression { return ""+(op1 == op2) }
  / op1:Operator _ ("!=" / "<>") _ op2:Expression { return ""+(op1 != op2) }
  / op1:Operator _ ">"  _ op2:Expression { return ""+(op1 >  op2) }
  / op1:Operator _ ">=" _ op2:Expression { return ""+(op1 >= op2) }
  / op1:Operator _ "<"  _ op2:Expression { return ""+(op1 <  op2) }
  / op1:Operator _ "<=" _ op2:Expression { return ""+(op1 <= op2) }
  / op1:Operator _ "eq" _ op2:Expression { return ""+(op1 === op2) }
  / op1:Operator _ "ne" _ op2:Expression { return ""+(op1 !== op2) }
  / op1:Operator _ "&&" _ op2:Expression { return ""+(["false", "no", "0", 0].indexOf(op1) < 0 && ["false", "no", "0", 0].indexOf(op2) < 0) }
  / op1:Operator _ "||" _ op2:Expression { return ""+(["false", "no", "0", 0].indexOf(op1) < 0 || ["false", "no", "0", 0].indexOf(op2) < 0) }
  / Operator
  
Operator
  = head:Term tail:(_ ("." / "+" / "-") _ Term)* {
      var result = head, i;

      for (i = 0; i < tail.length; i++) {
        if (tail[i][1] === ".") { result += ""+tail[i][3]; }
        if (tail[i][1] === "+") { result = +result + +tail[i][3]; }
        if (tail[i][1] === "-") { result -= tail[i][3]; }
      }

      return result;
    }

Term
  = head:Factor tail:(_ ("*" / "/") _ Factor)* {
      var result = head, i;

      for (i = 0; i < tail.length; i++) {
        if (tail[i][1] === "*") { result *= tail[i][3]; }
        if (tail[i][1] === "/") { result /= tail[i][3]; }
      }

      return result;
    }

Factor
  = "!" _ expr:Expression { return ["false", "no", "0", 0].indexOf(expr) >= 0 ? "true" : "false" }
  / "num(" _ expr:Expression _ ")" { return ""+(parseFloat(expr) || "") }
  / "str(" _ expr:Expression _ ")" { return ""+expr }
  / "sqrt(" _ expr:Expression _ ")" { return ""+Math.sqrt(expr) }
  / "int(" _ expr:Expression _ ")" { return ""+(expr < 0 ? Math.ceil(expr) : Math.floor(expr)) }
  / "boolean(" _ expr:Expression _ ")" { return ["false", "no", "0", 0].indexOf(expr) >= 0 ? "false" : "true" }
  / "max(" _ expr1:Expression _ "," _ expr2:Expression _ ")" { return Math.max(expr1, expr2) }
  / "min(" _ expr1:Expression _ "," _ expr2:Expression _ ")" { return Math.min(expr1, expr2) }
  / "concat(" _ head:Expression tail:(_ "," _ Expression)* _ ")" { return tail.reduce(function(acc,val) { return acc+val[3] }, ""+head) }
  / "cond(" _ exprCond:Expression _ "," _ exprTrue:Expression _ "," _ exprFalse:Expression _ ")" { return ["false", "no", "0", 0].indexOf(exprCond) < 0 ? exprTrue : exprFalse }
  / "any(" _ head:Expression tail:(_ "," _ Expression)* _ ")" { return tail.reduce(function(acc,val) { return acc || val[3] }, ""+head) }
  / "tag(" _ expr:Expression _ ")" { return styleparser.evalparser.tag(expr) }
  / "(" _ expr:Expression _ ")" { return expr; }
  / String

String "string"
  = "none" { return "" }
  / "-"? [0-9]+ ("." [0-9]+)? ("E" "-"? [0-9]+)? { return ""+parseFloat(text()); }
  / parts:('"' DoubleStringCharacters '"' / "'" SingleStringCharacters "'") { return parts[1]; }

_ "whitespace"
  = [ \t\n\r]*

/* ==== strings ==== */

DoubleStringCharacters
  = chars:DoubleStringCharacter* { return chars.join(""); }

SingleStringCharacters
  = chars:SingleStringCharacter* { return chars.join(""); }

DoubleStringCharacter
  = !('"' / "\\") char_:.        { return char_;     }
  / "\\" sequence:EscapeSequence { return sequence;  }

SingleStringCharacter
  = !("'" / "\\") char_:.        { return char_;     }
  / "\\" sequence:EscapeSequence { return sequence;  }

EscapeSequence
  = CharacterEscapeSequence
  // / "0" !DecimalDigit { return "\0"; }
  // / HexEscapeSequence
  // / UnicodeEscapeSequence //TODO?

CharacterEscapeSequence
  = SingleEscapeCharacter

SingleEscapeCharacter
  = char_:['"\\bfnrtv] {
      return char_
        .replace("b", "\b")
        .replace("f", "\f")
        .replace("n", "\n")
        .replace("r", "\r")
        .replace("t", "\t")
        .replace("v", "\x0B") // IE does not recognize "\v".
    }


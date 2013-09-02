/*
 * Parser for human readable OSM geo data search queries.
 */

start
  = _ x:geo_query _ { return x }

geo_query
  = x:query whitespace+ "in" whitespace+ y:string
    { return { bounds:"area", query:x, area:y } }
  / x:query whitespace+ "around" whitespace+ y:string
    { return { bounds:"around", query:x, area:y } }
  / x:query whitespace+ "global"
    { return { bounds:"global", query:x } }
  / x:query
    { return { bounds:"bbox", query:x } }

query
  = logical_or

logical_or
  = x:logical_and whitespace+ ( "or" / "OR" / "|" / "||" ) whitespace+ y:logical_or
    { return { logical:"or", queries:[x,y] } }
  / x:logical_and whitespace+ ( "xor" / "XOR" ) whitespace+ y:logical_and
    { return { logical:"xor", queries:[x,y] } }
  / x:logical_and whitespace+ ( "except" / "EXCEPT" ) whitespace+ y:logical_and
    { return { logical:"minus", queries:[x,y] } }
  / x:logical_and

logical_and
  = x:braces whitespace+ ( "and" / "AND" / "&" / "&&" ) whitespace+ y:logical_and
    { return { logical:"and", queries:[x,y] } }
  / x:braces

/*logical_not
  =  TODO? */

braces
  = statement
  / "(" _ x:logical_or _ ")" { return x; }

statement
  = type
  / meta
  / key_eq_val
  / key_not_eq_val
  / key_present
  / key_not_present
  / key_like_val
  / free_form

key_eq_val
  = x:string _ ( "=" / "==" ) _ y:string
    { return { query:"eq", key:x, val:y } }

key_not_eq_val
  = x:string _ ( "!=" / "<>" ) _ y:string
    { return { query:"neq", key:x, val:y } }

key_present
  = x:string _ ( "=" / "==" ) _ "*"
    { return { query:"key", key:x } }

key_not_present
  = x:string _ ( "!=" / "<>" ) _ "*"
    { return { query:"nokey", key:x } }

key_like_val
  = x:string _ ( "~" / "~=" / ":" ) _ y:string
    { return { query:"like", key:x, val:y } } 

type
  = "type" _ ":" _ x:string
    { return { query:"type", type:x } }

meta // TODO?
  = x:("user" / "uid" / "newer" / "id") _ ":" _ y:string
    { return { query:"meta", meta:x, val:y } }

free_form
  = x:string
    { return { query:"free form", free:x } }

/* ==== strings ==== */

string "string"
  = s:[a-zA-Z0-9_]+ { return s.join(''); }
  / parts:('"' DoubleStringCharacters? '"' / "'" SingleStringCharacters? "'") {
      return parts[1];
    }

DoubleStringCharacters
  = chars:DoubleStringCharacter+ { return chars.join(""); }

SingleStringCharacters
  = chars:SingleStringCharacter+ { return chars.join(""); }

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


/* ===== Whitespace ===== */

_ "whitespace"
  = whitespace*

whitespace "whitespace"
  = [ \t\n\r]


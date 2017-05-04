import chai from 'chai';
var expect = chai.expect;
import evalparser from '../js/jsmapcss/eval.pegjs';

describe("mapcss.eval", function () {
  it("strings", function () {
    var q = '"foo"'
    var p = evalparser.parse(q)
    expect(p).to.equal("foo");
    var q = "'foo'"
    var p = evalparser.parse(q)
    expect(p).to.equal("foo");
  });
  it("num()", function () {
    var q = 'num("12.3")'
    var p = evalparser.parse(q)
    expect(p).to.equal("12.3");
    var q = 'num("foo")'
    var p = evalparser.parse(q)
    expect(p).to.equal("");
    var q = 'num("-12.3E-1")'
    var p = evalparser.parse(q)
    expect(p).to.equal("-1.23");
  });
  it("str()", function () {
    var q = 'str(12.3)'
    var p = evalparser.parse(q)
    expect(p).to.equal("12.3");
  });
  it("number arithmetic", function () {
    var q = '(1+2*3-4/2-1)*2'
    var p = evalparser.parse(q)
    expect(p).to.equal("8");
  });
  it("int", function () {
    var q = 'int(3.1)'
    var p = evalparser.parse(q)
    expect(p).to.equal("3");
    var q = 'int(3.9)'
    var p = evalparser.parse(q)
    expect(p).to.equal("3");
    var q = 'int(-3.1)'
    var p = evalparser.parse(q)
    expect(p).to.equal("-3");
    var q = 'int(-3.9)'
    var p = evalparser.parse(q)
    expect(p).to.equal("-3");
  });
  it("number EIAS", function () {
    var q = '"2" + 4'
    var p = evalparser.parse(q)
    expect(p).to.equal("6");
    var q = '"2" == 2'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
  });
  it("none", function () {
    var q = 'none'
    var p = evalparser.parse(q)
    expect(p).to.equal("");
  });
  it("none aithmetic", function () {
    var q = '2 + none'
    var p = evalparser.parse(q)
    expect(p).to.equal("2");
    var q = '2 * none'
    var p = evalparser.parse(q)
    expect(p).to.equal("0");
  });
  it("none EIAS", function () {
    var q = '2."" == 2'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
    var q = '2+"" == 2'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
    var q = 'none == ""'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
  });
  it("boolean", function () {
    var q = 'boolean(0)'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = 'boolean("0")'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = 'boolean("no")'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = 'boolean("false")'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = 'boolean("")'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = 'boolean(none)'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = 'boolean("foobar")'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
    var q = 'boolean("yes") == boolean("true")'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
  });
  it("boolean arithmetic", function () {
    var q = '"true" && "false"'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = '"true" || "false"'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
    var q = '!"true"'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
  });
  it("comparison operators", function () {
    var q = '2.3 > 01.2'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
    var q = '2 >= 2'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
    var q = '2 < 2'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = '1 <= 2'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
    var q = '"2" == "2"'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
    var q = '"2" == "02"'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
    var q = '"2" == "3"'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = '"2" eq "2"'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
    var q = '"2" eq "02"'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = '"2" != "02"'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = '"2" <> "02"'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = '"2" ne "2"'
    var p = evalparser.parse(q)
    expect(p).to.equal("false");
    var q = '"2" ne "02"'
    var p = evalparser.parse(q)
    expect(p).to.equal("true");
  });
  it("general functions", function () {
    var q = 'tag("_")'
    evalparser.tag = function(_) { return "foo" }
    var p = evalparser.parse(q)
    expect(p).to.equal("foo");
    var q = 'cond("true", "a", "b")'
    var p = evalparser.parse(q)
    expect(p).to.equal("a");
    var q = 'cond("false", "a", "b")'
    var p = evalparser.parse(q)
    expect(p).to.equal("b");
    var q = 'any(none, "", "foo", "bar")'
    var p = evalparser.parse(q)
    expect(p).to.equal("foo");
  });
  it("numeric functions", function () {
    var q = 'max(1,2,3)'
    var p = evalparser.parse(q)
    expect(p).to.equal("3");
    var q = 'min(1,2,-3)'
    var p = evalparser.parse(q)
    expect(p).to.equal("-3");
    var q = 'sqrt(16)'
    var p = evalparser.parse(q)
    expect(p).to.equal("4");
  });
  it("string functions", function () {
    var q = 'concat("foo","bar","asd","fasd")'
    var p = evalparser.parse(q)
    expect(p).to.equal("foobarasdfasd");
    var q = '"foo" . 123 . "bar"'
    var p = evalparser.parse(q)
    expect(p).to.equal("foo123bar");
  });
});

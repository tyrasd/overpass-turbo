import chai from 'chai';
var expect = chai.expect;
import sinon from 'sinon';
import turbo from '../js/ide';
import settings from '../js/settings';
import urlParameters from '../js/urlParameters';

describe("urlParameters", function () {

  // no parameters
  it("defaults", function () {
    var args = urlParameters("");
    expect(args.has_query).to.be.equal(false);
    expect(args.has_coords).to.be.equal(false);
    expect(args.has_zoom).to.be.equal(false);
    expect(args.run_query).to.be.equal(false);
    var args = urlParameters("?");
    expect(args.has_query).to.be.equal(false);
    expect(args.has_coords).to.be.equal(false);
    expect(args.has_zoom).to.be.equal(false);
    expect(args.run_query).to.be.equal(false);
  });
  // query (uncompressed)
  it("query", function () {
    var args = urlParameters("?Q=foo");
    expect(args.has_query).to.be.equal(true);
    expect(args.query).to.be.equal("foo");
    expect(args.has_coords).to.be.equal(false);
    expect(args.has_zoom).to.be.equal(false);
  });
  // query (compressed)
  it("query (compressed)", function () {
    var args = urlParameters("?q=Zm9v");
    expect(args.has_query).to.be.equal(true);
    expect(args.query).to.be.equal("foo");
    expect(args.has_coords).to.be.equal(false);
    expect(args.has_zoom).to.be.equal(false);
  });
  // coords (uncompressed)
  it("coords", function () {
    var args = urlParameters("?C=0;180;1");
    expect(args.has_query).to.be.equal(false);
    expect(args.has_coords).to.be.equal(true);
    expect(args.coords.lat).to.be.equal(0.0);
    expect(args.coords.lng).to.be.equal(180.0);
    expect(args.has_zoom).to.be.equal(true);
    expect(args.zoom).to.be.equal(1);
  });
  // coords (uncompressed, lat/lon/zoom)
  it("coords (lat/lon/zoom)", function () {
    var args = urlParameters("?lat=0&lon=180.0&zoom=1");
    expect(args.has_query).to.be.equal(false);
    expect(args.has_coords).to.be.equal(true);
    expect(args.coords.lat).to.be.equal(0.0);
    expect(args.coords.lng).to.be.equal(180.0);
    expect(args.has_zoom).to.be.equal(true);
    expect(args.zoom).to.be.equal(1);
    var args = urlParameters("?lat=0&lon=180.0");
    expect(args.has_query).to.be.equal(false);
    expect(args.has_coords).to.be.equal(true);
    expect(args.coords.lat).to.be.equal(0.0);
    expect(args.coords.lng).to.be.equal(180.0);
    expect(args.has_zoom).to.be.equal(false);
    var args = urlParameters("?zoom=1");
    expect(args.has_query).to.be.equal(false);
    expect(args.has_coords).to.be.equal(false);
    expect(args.has_zoom).to.be.equal(true);
    expect(args.zoom).to.be.equal(1);
  });
  // coords (compressed)
  it("coords (compressed)", function () {
    var args = urlParameters("?c=CTVpCWdRAB");
    expect(args.has_coords).to.be.equal(true);
    expect(args.coords.lat).to.be.equal(0.0);
    expect(args.coords.lng).to.be.equal(180.0);
    expect(args.has_zoom).to.be.equal(true);
    expect(args.zoom).to.be.equal(1);
  });
  // RUN flag
  it("RUN flag", function () {
    var args = urlParameters("?Q=foo&R");
    expect(args.run_query).to.be.equal(true);
    var args = urlParameters("?Q=foo&R=true");
    expect(args.run_query).to.be.equal(true);
  });
  // template
  it("template", function () {
    var orig_ss = settings.saves;
    settings.saves = {"T":{"type":"template","parameters":["p"],"wizard":"{{p}}"}}
    var args = urlParameters("?template=T&p=foo");
    setTimeout(function() { // await ffs.construct_query callback
      expect(args.has_query).to.be.equal(true);
      expect(args.query).to.be.equal("foo");
      settings.saves = orig_ss;
    }, 100);
  });


});

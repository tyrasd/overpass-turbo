// query autorepair module
if (typeof turbo === "undefined") turbo={};
turbo.autorepair = function(q, lng) {
  var repair = {};

  var comments = {};

  (function init() {
    // replace comments with placeholders
    // (we do not want to autorepair stuff which is commented out.)
    if (lng == "xml") {
      var cs = q.match(/<!--[\s\S]*?-->/g) || [];
      for (var i=0; i<cs.length; i++) {
        var placeholder = "<!--"+Math.random().toString()+"-->"; //todo: use some kind of checksum or hash maybe?
        q = q.replace(cs[i],placeholder);
        comments[placeholder] = cs[i];
      }
    } else {
      var cs = q.match(/\/\*[\s\S]*?\*\//g) || []; // multiline comments: /*...*/
      for (var i=0; i<cs.length; i++) {
        var placeholder = "/*"+Math.random().toString()+"*/"; //todo: use some kind of checksum or hash maybe?
        q = q.replace(cs[i],placeholder);
        comments[placeholder] = cs[i];
      }
      var cs = q.match(/\/\/[^\n]*/g) || []; // single line coments: //...
      for (var i=0; i<cs.length; i++) {
        var placeholder = "/*"+Math.random().toString()+"*/"; //todo: use some kind of checksum or hash maybe?
        q = q.replace(cs[i],placeholder);
        comments[placeholder] = cs[i];
      }
    }
  })();

  repair.getQuery = function() {
    // expand placeholded comments
    for(var placeholder in comments) {
      q = q.replace(placeholder,comments[placeholder]);
    }
    return q;
  }

  repair.recurse = function() {
    if (lng == "xml") {
      // do some fancy mixture between regex magic and xml as html parsing :€
      var prints = q.match(/(\n?[^\S\n]*<print[\s\S]*?(\/>|<\/print>))/g) || [];
      for (var i=0;i<prints.length;i++) {
        var ws = prints[i].match(/^\n?(\s*)/)[1]; // amount of whitespace in front of each print statement
        var from = $("print",$.parseXML(prints[i])).attr("from");
        var add1,add2,add3;
        if (from) { 
          add1 = ' into="'+from+'"'; add2 = ' set="'+from+'"'; add3 = ' from="'+from+'"'; 
        } else {
          add1 = ''; add2 = ''; add3 = ''; 
        }
        q = q.replace(prints[i],"\n"+ws+"<!-- added by auto repair -->\n"+ws+"<union"+add1+">\n"+ws+"  <item"+add2+"/>\n"+ws+"  <recurse"+add3+' type="down"/>\n'+ws+"</union>\n"+ws+"<!-- end of auto repair --><autorepair>"+i+"</autorepair>");
      }
      for (var i=0;i<prints.length;i++) 
        q = q.replace("<autorepair>"+i+"</autorepair>", prints[i]);
    } else {
      var outs = q.match(/(\n?[^\S\n]*(\.[^.;]+)?out[^:;"\]]*;)/g) || [];
      for (var i=0;i<outs.length;i++) {
        var ws = outs[i].match(/^\n?(\s*)/)[0]; // amount of whitespace
        var from = outs[i].match(/\.([^;.]+?)\s+?out/);
        var add;
        if (from)
          add = "(."+from[1]+";."+from[1]+" >;)->."+from[1]+";";
        else
          add = "(._;>;);";
        q = q.replace(outs[i],ws+"/*added by auto repair*/"+ws+add+ws+"/*end of auto repair*/<autorepair>"+i+"</autorepair>");
      }
      for (var i=0;i<outs.length;i++) 
        q = q.replace("<autorepair>"+i+"</autorepair>", outs[i]);
    }
    return true;
  }

  repair.editors = function() {
    if (lng == "xml") {
      // 1. fix <osm-script output=*
      var src = q.match(/<osm-script([^>]*)>/);
      if (src) {
        var output = $("osm-script",$.parseXML(src[0]+"</osm-script>")).attr("output");
        if (output && output != "xml") {
          var new_src = src[0].replace(output,"xml");
          q = q.replace(src[0],new_src+"<!-- fixed by auto repair -->");
        }
      }
      // 2. fix <print mode=*
      var prints = q.match(/(<print[\s\S]*?(\/>|<\/print>))/g) || [];
      for (var i=0;i<prints.length;i++) {
        var mode = $("print",$.parseXML(prints[i])).attr("mode");
        if (mode == "meta")
          continue;
        var new_print = prints[i];
        if (mode)
          new_print = new_print.replace(mode,"meta");
        else
          new_print = new_print.replace("<print",'<print mode="meta"');
        q = q.replace(prints[i],new_print+"<!-- fixed by auto repair -->");
      }
    } else {
      // 1. fix [out:*]
      var out = q.match(/\[\s*out\s*:\s*([^\]\s]+)\s*\]\s*;?/);
          ///^\s*\[\s*out\s*:\s*([^\]\s]+)/);
      if (out && out[1] != "xml")
        q = q.replace(/(\[\s*out\s*:\s*)([^\]\s]+)(\s*\]\s*;?)/,"$1xml$3/*fixed by auto repair*/");
      // 2. fix out *
      var prints = q.match(/out[^:;]*;/g) || [];
      for (var i=0;i<prints.length;i++) {
        if (prints[i].match(/\s(meta)/))
          continue;
        var new_print = prints[i].replace(/\s(body|skel|ids|tags)/,"").replace("out","out meta");
        q = q.replace(prints[i],new_print+"/*fixed by auto repair*/");
      }
    }
    return true;
  }

  return repair;
};


turbo.autorepair.detect = {};
turbo.autorepair.detect.editors = function(q, lng) {
  // todo: move into autorepair "module"
  q = q.replace(/{{.*?}}/g,"");
  var err = {};
  if (lng == "xml") {
    try {
      var xml = $.parseXML("<x>"+q+"</x>");
      $("print",xml).each(function(i,p) { if($(p).attr("mode")!=="meta") err.meta=true; });
      var out = $("osm-script",xml).attr("output");
      if (out !== undefined && out !== "xml")
        err.output = true;
    } catch(e) {} // ignore xml syntax errors ?!
  } else {
    // ignore comments
    q=q.replace(/\/\*[\s\S]*?\*\//g,"");
    q=q.replace(/\/\/[^\n]*/g,"");
    var out = q.match(/\[\s*out\s*:\s*([^\]\s]+)\s*\]\s*;/);
    if (out && out[1] != "xml")
      err.output = true;
    var prints = q.match(/out([^:;]*);/g);
    $(prints).each(function(i,p) {if (p.match(/(body|skel|ids)/) || !p.match(/meta/)) err.meta=true;});
  }
  return $.isEmptyObject(err);
}
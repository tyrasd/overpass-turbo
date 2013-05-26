// sources module
turbo.style = function( user_mapcss, no_defaults ) {
    var default_style = ''
        // point features
        +'node {color:#03f; width:2; opacity:0.7; fill-color:#fc0; fill-opacity:0.3;} \n'
        // line features
        +'line {color:#03f; width:5; opacity:0.6;} \n'
        // polygon features
        +'area {color:#03f; width:2; opacity:0.7; fill-color:#fc0; fill-opacity:0.3;} \n'
        // style modifications
        // objects in relations
        +'relation node, relation way, relation relation {color:#d0f;} \n'
        // tainted objects
        +'way:tainted, relation:tainted {dashes:5,8;} \n'
        // multipolygon outlines without tags
        +'way:mp_outline:untagged {width:2; opacity:0.7;} \n'
        // placeholder points
        +'way:placeholder, relation:placeholder {fill-color:red;} \n'
        // highlighted features
        +'node:active, way:active, relation:active {color:#f50; fill-color:#f50;} \n'
    ;

    var mapcss = new styleparser.RuleSet();
    mapcss.parseCSS( 
        (!no_defaults ? default_style : '') +
        (user_mapcss || '')
    );

    var s = {};

    s.styleFeature = function( feature, highlight ) {
        return = mapcss.getStyles( feature );
    }

          var s = mapcss.getStyles({
            isSubject: 
            getParentObjects: function() {
              if (feature.properties.relations.length == 0)
                return [];
              else
                return feature.properties.relations.map(function(rel) {
                  return {
                    tags: rel.reltags,
                    isSubject: function(subject) {
                      return subject=="relation" || 
                             (subject=="area" && rel.reltags.type=="multipolyon");
                    },
                    getParentObjects: function() {return [];},
                  }
                });
            } 
          }, _.extend(
            feature.properties && feature.properties.tainted ? {":tainted": true} : {},
            feature.properties && feature.properties.mp_outline ? {":mp_outline": true} : {},
            feature.is_placeholder ? {":placeholder": true} : {},
            hasInterestingTags(feature.properties) ? {":tagged":true} : {":untagged": true},
            highlight ? {":active": true} : {},
            feature.properties.tags)
          , 18 /*restyle on zoom??*/);
          return s;

    return s;
};
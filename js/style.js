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

    s.styleFeature = function( feature ) {
        feature.setStyle( mapcss.getStyles(feature) );
    }

    s.styleFeatureCollection = function( featureColection ) {
        _.each( featureColection.features, function( feature ) {
            s.styleFeature(feature);
        });
    }

    s.styleFeatureCollections = function( featureColections, callback ) {
        _.each( featureColections, function( featureCollection ) {
            s.styleFeatureCollection(featureCollection);
        });
        callback(featureColections);
    }

    return s;
};
// main turbo module
turbo = function(_sources, _formats ) {
    var dispatcher = turbo.dispatch();

    var sources = _sources;
    // if no proper sources object was specified, create a new one with the overpass-source
    if ( !sources ) {
        sources = turbo.sources();
        sources.registerSource( 'overpass', turbo.sources.overpass() );
    }

    var formats = _formats;
    // if no proper formats object was specified, create a new one with the osm-format
    if ( !formats ) {
        formats = turbo.formats();
        formats.registerFormat( turbo.formats.osm() );
    }

    // the module object
    var t = {};

    t.run = function( query, data_source, style, callback ) {
        var options;
        var source;

        try {
            var sources_md = sources.getSource(data_source);
        } catch (e) {
            // todo: error handling
            console.log("ERROR: no proper data source found");
            return null;
        }

        source = sources_md.source;
        options = sources_md.options;

        source.request( query, options, function( result ) {
            // todo: setTimeout into the calling function! than, this is only "source.request( query, options, _.partial...);" - also below
            // result = { data, meta, stats }
            // todo: ... save result.* for getData(), getMeta(), getStats()
            setTimeout( _.partial( t.toGeoJson, result.data, result.meta, style, callback ), 0 );
        });

    }

    t.toGeoJson = function( data, meta, style, callback ) {
        try {
            var format = formats.getMatchingFormat( data, meta );
        } catch (e) {
            // todo: error handling
            console.log("ERROR: no proper data format found");
            return null;
        }
        // todo: webworker implementation
        format.toGeoJson( data, function(geoJson) {
            // continue with styling
            setTimeout( _.partial( t.style, geoJson, style, callback ), 0 );
        });
    }

    t.style = function( geoJson, style, callback ) {
        if ( !style )
            style = turbo.style();
        if ( typeof style == 'string' )
            style = turbo.style( style );
        // todo: webworker implementation
        style.styleFeatureCollections( geoJson, function() {
            // final callback
            callback(geoJson);
        });
    }

    

    t.getSources = function() {
        return sources;
    }
    t.getFormats = function() {
        return formats;
    }

    _.assign(t,dispatcher);
    return t;
};
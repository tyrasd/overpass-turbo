// formats module
turbo.formats = function() {
	var formats = [];

	var f = {};

	f.registerFormat = function( format ) {
        formats.push( format );
    }

    f.getMatchingFormat = function( data, meta ) {
    	_.each( formats, function( format ) {
    		if ( format.match(data,meta) )
    			return format;
    	});
    }

	return f;
};
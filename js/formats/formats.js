// formats module
turbo.formats = function() {
	var formats = [];

	var f = {};

	f.registerFormat = function( format ) {
        formats.push( format );
    }

    f.getMatchingFormat = function( data, meta ) {
    	for ( var i = 0; i < formats.length; i++ ) {
            var format = formats[i];
    		if ( format.match(data,meta) )
    			return format;
    	}
    	throw "unknown data format";
    }

	return f;
};
// sources module
turbo.sources = function() {
    var sources = {};

    var s = {};

    s.registerSource = function(name, source) {
    	sources[name] = source;
    }

    s.getSource = function(data_source) {
    	var source_name = 'overpass'; // default
    	var options = {};
        if (data_source) {
            // parse custom data statement
            data_source = data_source.split(',');
            source_name = data_source.shift();
            // this creates a key-value object from a "key=value"-string list
            // e.g. ["asd=fasd", "foo=bar=baz"] -> {asd:"fasd",foo:"bar=baz"}
            options = _.object(_.map( data_source, function(s) {
                return s.split(/=([\s\S]*)/);
            }));
        }
        var source = sources[source_name];
        if ( !source ) {
            throw "unknown data source \""+source+"\"";
        }
        return {
        	name: source_name,
        	source: source,
        	options: options
        };
    }

    return s;
};
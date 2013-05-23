// overpass data source module
turbo.sources.overpass = function() {
    var settings = turbo.settings();
    var dispatcher = turbo.dispatcher();

    var options = {};
    var callback;
    var result = {};

    var _ajax_request;
    
    function getQueryLang(query) {
        // note: cannot use this.getQuery() here, as this function is required by that.
        if ( $.trim(query).match(/^</) )
            return 'xml';
        else
            return 'OverpassQL';
    }

    var source = {};
    _.assign(source,dispatcher);

    source.request = function( query, opt, _callback ) {
        options = opt;
        callback = _callback;
        result = {};
        var server = options.server || settings.server;
        // ...
        // 1. get overpass json data
        fire('progress', "preparing Overpass API call");
        if (getQueryLang(query) == "xml") {
            // beautify not well formed xml queries (workaround for non matching error lines)
            if ( !query.match(/^<\?xml/) ) {
                if ( !query.match(/<osm-script/) )
                    query = '<osm-script timeout="10">'+query+'</osm-script>';
                query = '<?xml version="1.0" encoding="UTF-8"?>'+query;
            }
        }
        var request_headers = {};
        var additional_get_data = '';
        if (settings.force_simple_cors_request) {
            additional_get_data = '?X-Requested-With='+turbo.configs.appname;
        } else {
            request_headers['X-Requested-With'] = turbo.configs.appname;
        }
        // call Overpass API
        fire('progress', "calling Overpass API interpreter", function() {
            // kill the query on abort
            _ajax_request.abort();
            // close wait spinner
            fire('abort');
            // try to abort queries via kill_my_queries
            $.get(server+'kill_my_queries');
        });
        _ajax_request = $.ajax(
            /*url:*/ server+'interpreter'+additional_get_data, {
            type: 'POST',
            data: { data: query },
            headers: request_headers,
            success: dataRecieved,
            error: handleError
        });
    };

    function handleError( jqXHR, textStatus, errorThrown ) {
        if (textStatus == 'abort')
            return; // ignore aborted queries.
        fire('progress', "error during ajax call");
        if (jqXHR.status == 400 || jqXHR.status == 504 || jqXHR.status == 429) {
            // pass 400 Bad Request errors to the standard result parser, as this is most likely going to be a syntax error in the query.
            dataRecieved(jqXHR.responseText, textStatus, jqXHR);
            return;
        }
        result.type = "error";
        result.text = jqXHR.resultText;
        var errmsg = "";
        if (jqXHR.state() == 'rejected')
            errmsg += "<p>Request rejected. (e.g. server not found, redirection, internal server errors, etc.)</p>";
        if (textStatus == 'parsererror')
            errmsg += "<p>Error while parsing the data (parsererror).</p>";
        else if (textStatus != 'error' && textStatus != jqXHR.statusText)
            errmsg += "<p>Error-Code: "+textStatus+"</p>";
        if ((jqXHR.status != 0 && jqXHR.status != 200) || jqXHR.statusText != 'OK') // note to me: jqXHR.status "should" give http status codes
            errmsg += "<p>Error-Code: "+jqXHR.statusText+" ("+jqXHR.status+")</p>";
        fire("ajaxError", errmsg);
    }

    function dataRecieved( data, textStatus, jqXHR ) {
        fire("progress", "Overpass API answered");
        var data_amount = jqXHR.responseText.length;
        var data_txt;
        // round amount of data
        var scale = Math.floor(Math.log(data_amount)/Math.log(10));
        data_amount = Math.round(data_amount / Math.pow(10,scale)) * Math.pow(10,scale);
        if (data_amount < 1000)
            data_txt = data_amount + " bytes";
        else if (data_amount < 1000000)
            data_txt = data_amount / 1000 + " kB";
        else
            data_txt = data_amount / 1000000 + " MB";
        fire('progress', "recieved about "+data_txt+" of data");
        var dataRecieved_callback = options.onDataRecieved || function(da,dt,ac,cc) { cc(); };
        dataRecieved_callback(data_amount, data_txt, 
        function() { // abort callback
            fire('abort');
            return;
        },
        function() { // continue callback
            fire('progress', "parsing data");
            // continue with parsing the data
            setTimeout( function() { parseData( data, jqXHR ); } , 0 );
        });
    }

    function parseData ( data, jqXHR ) {
        // different cases of loaded data: json data, xml data or error message?
        var data_mode = null;
        var geojson;
        var stats = {};
        // hacky firefox hack #1 :( (it is not properly detecting json from the content-type header)
        if (typeof data == 'string' && data[0] == '{') { // if the data is a string, but looks more like a json object
            try {
                data = $.parseJSON(data);
            } catch (e) {}
        }
        // hacky firefox hack #2 :( (it is not properly detecting xml from the content-type header)
        if (typeof data == 'string' && 
            data.substr(0,5) == '<?xml' && 
            jqXHR.status === 200 && 
            !(jqXHR.getResponseHeader('content-type') || '').match(/text\/html/) && 
            data.match(/<osm/))
        {
            try {
                jqXHR.responseXML = data;
                data = $.parseXML(data);
            } catch (e) {
                delete jqXHR.responseXML;
            }
        }
        // check for error messages
        if ((typeof data == 'string') ||
            (typeof data == 'object' && jqXHR.responseXML && $('remark',data).length > 0) ||
            (typeof data == 'object' && data.remark && data.remark.length > 0)
           )
        {
            data_mode = 'unknown';
            var is_error = false;
            is_error = is_error || (typeof data == 'string' && // html coded error messages
                data.indexOf('Error') != -1 && 
                data.indexOf('<script') == -1 && // detect output="custom" content
                data.indexOf('<h2>Public Transport Stops</h2>') == -1); // detect output="popup" content
            is_error = is_error || (typeof data == 'object' &&
                jqXHR.responseXML &&
                $('remark',data).length > 0);
            is_error = is_error || (typeof data == 'object' &&
                data.remark &&
                data.remark.length > 0);
            if (is_error) {
                // this really looks like an error message, so lets throw an error message
                var errmsg = "?";
                if (typeof data == 'string')
                    errmsg = data.replace(/((.|\n)*<body>|<\/body>(.|\n)*)/g,'');
                if (typeof data == 'object' && jqXHR.responseXML)
                    errmsg = "<p>"+$.trim($('remark',data).text())+"</p>";
                if (typeof data == 'object' && data.remark)
                    errmsg = "<p>"+$.trim(data.remark)+"</p>";
                fire('queryError', errmsg);
                data_mode = 'error';
                // parse errors and highlight error lines
                var errlines = errmsg.match(/line \d+:/g) || [];
                for (var i=0; i<errlines.length; i++) {
                    fire('queryErrorLine', 1*errlines[i].match(/\d+/)[0]);
                }
            }
            // the html error message returned by overpass API looks goods also in xml mode ^^
            result.type = 'error';
            data = {elements:[]};
            result.meta = {};
            result.stats = {nodes: 0, ways: 0, relations: 0, areas: 0};
        } else if (typeof data == 'object' && jqXHR.responseXML) { // osm xml data
            result.type = 'osm';
            data_mode = 'xml';
            result.meta = {
                timestamp: $('osm > meta:first-of-type',data).attr('osm_base'),
                copyright: $('osm > note:first-of-type',data).text()
            };
            result.stats = {
                nodes:     $('osm > node',data).length,
                ways:      $('osm > way',data).length,
                relations: $('osm > relation',data).length,
                areas:     $('osm > area',data).length
            };
        } else { // maybe json data
            result.type = 'osmjson';
            data_mode = 'json';
            result.meta = {
                timestamp: data.osm3s.timestamp_osm_base,
                copyright: data.osm3s.copyright
            };
            result.stats = {
                nodes:     _.filter(data.elements, function(d) {return d.type=='node'}).length,
                ways:      _.filter(data.elements, function(d) {return d.type=='way'}).length,
                relations: _.filter(data.elements, function(d) {return d.type=='relation'}).length,
                areas:     _.filter(data.elements, function(d) {return d.type=='area'}).length
            };
        }
        result.data = data;

        // call back with result data
        callback(result);
    }

    return source;
}
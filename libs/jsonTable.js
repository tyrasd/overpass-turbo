/* taken from https://raw.github.com/omkarkhair/jsonTable/master/jsonTable.js
 * published there under MIT-License
 */
 
(function ( $ ) {
 
    $.fn.jsonTable = function( options ) {
        var settings = $.extend({
            head: [],
            json:[]
        }, options );
        this.data("settings",settings);
        var thead = $(this.selector + ' thead').append("<tr></tr>\n");
        for(var i = 0; i < settings.head.length; i++){
             $(this.selector + ' tr').append("<th>"+settings.head[i]+"</th>\n")
        }
        return this;
    };

    $.fn.jsonTableUpdate = function( options ){
        var opt = $.extend({
            source: undefined,
            rowClass: undefined,
            callback: undefined
        }, options );
        var settings = this.data("settings");
        var sel = this.selector;
        $(this.selector + ' tbody > tr').remove();

        if(typeof opt.source == "string")
        {
            $.get(opt.source, function(data) {
                $.fn.updateFromObj(data,settings,sel, opt.rowClass, opt.callback);
            });
        }
        else if(typeof opt.source == "object")
        {
            $.fn.updateFromObj(opt.source,settings,sel, opt.rowClass, opt.callback);
        }
    }

    $.fn.updateFromObj = function(obj,settings,selector, trclass, callback){
        var row = "";
        
        for(var i = 0; i < obj.length; i++){
            if (!trclass) {
                row += "<tr>";
            } else {
                row += "<tr class='" + trclass + "'>";
            }
            
            for (var j = 0; j < settings.json.length; j++) {
                if (obj[i][settings.json[j]]) {//if field is defined:
                  row += "<td>" + obj[i][settings.json[j]] + "</td>";        
                }
                else { //if undefined:
                  row += '<td class="emptyCell"></td>';
                }
            }
            row += "</tr>";
        }
        $(selector + '> tbody:last').append(row);
        
        if (typeof callback == "function") {
            callback();
        }
        
        $(window).trigger('resize'); // trigger the resize event to reposition dialog once all the data is loaded
    }
 
}( jQuery ));

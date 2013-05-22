// event dispatcher module
// lets you attatch simple on/off events to your modules
// based on PubSubJS https://github.com/mroderick/PubSubJS/
turbo.dispatch = function() {
    var seed = Math.floor((7+Math.random())*10000).toString()+'_';
    var wrappers = {};
    function hash ( event, listener ) {
        return Base64.encodeNum(Math.abs(crc32(listener.toString())))+event;
    }

    var dispatch = {};

    dispatch.on = function( event, listener ) {
        if ( !wrappers[hash(event,listener)] ) {
            var wrapper = function( msg, data ) { listener.apply(this, data); }
            wrappers[hash(event,listener )] = wrapper;
        }
        return PubSub.subscribe( seed+event, wrapper );
    }
    dispatch.off = function ( event, token_or_listener ) {
        return PubSub.unsubscribe( wrappers[hash(event,token_or_listener)] || token_or_listener );
    }
    dispatch.fire = function ( event ) {
        return PubSub.publish( seed+event, _.toArray(arguments).slice(1) );
    }

    return dispatch;
}
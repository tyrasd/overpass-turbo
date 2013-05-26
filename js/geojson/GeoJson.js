turbo.GeoJson = {};

/** Feature Base Class **/

turbo.GeoJson.Feature = function( id, type ) {
    this.properties = {
        type: type,
        id: id,
        tags: {},
        flags: {},
        meta: {}
    };
    this.partents = [];
};

turbo.GeoJson.Feature.prototype.properties = null;
turbo.GeoJson.Feature.prototype.geometry = null;
turbo.GeoJson.Feature.prototype.style = null;
turbo.GeoJson.Feature.prototype.partents = null;

turbo.GeoJson.Feature.prototype.setTags = function(tags) {
    _.extend( this.properties.tags, tags );
};
turbo.GeoJson.Feature.prototype.getTags = function() {
    return this.properties.tags;
};
turbo.GeoJson.Feature.prototype.setTag = function( tag, value ) {
    this.properties.tags[tag] = value;
};
turbo.GeoJson.Feature.prototype.getTag = function(tag) {
    if ( !this.properties.tags )
        return undefined;
    return this.properties.tags[tag];
};
turbo.GeoJson.Feature.prototype.setMeta = function(meta) {
    _.extend( this.properties.meta, meta );
};
turbo.GeoJson.Feature.prototype.getMeta = function() {
    return this.properties.meta;
};
turbo.GeoJson.Feature.prototype.setRelations = function(relations) {
    this.properties.relations = relations;
};
turbo.GeoJson.Feature.prototype.getRelations = function() {
    return this.properties.relations;
};
turbo.GeoJson.Feature.prototype.setStyle = function(style) {
    this.style = style;
};
turbo.GeoJson.Feature.prototype.getStyle = function() {
    return this.style;
};
turbo.GeoJson.Feature.prototype.setFlag = function( flag, value ) {
    this.flags[flag] = value;
};
turbo.GeoJson.Feature.prototype.getFlag = function(flag) {
    return this.flags[flag];
};
turbo.GeoJson.Feature.prototype.addParent = function(parent) {
    this.parents.push(parent);
}
turbo.GeoJson.Feature.prototype.getParents = function(parent) {
    return this.parents;
}

turbo.GeoJson.Feature.prototype.hasInterestingTags = function() {
    if ( !this.properties.tags )
        return false;
    return _.any( this.properties.tags, function(v,k) { return k!='created_by' || k!='source'; })
};

/* mapcss routines */
turbo.GeoJson.Feature.prototype.mapcss_getAttributes = function() { // todo: add a more general "flat properties" method and use that
    // create a copy of tags
    var all_tags = _.clone(this.properties.tags);
    // add 
    _.each( this.properties.flags, function(value, flag) {
        all_tags[':'+flag] = value;
    });
    if (this.hasInterestingTags())
        all_tags[':tagged'] = true;
    else
        all_tags[':untagged'] = true;
    return all_tags;
}
turbo.GeoJson.Feature.prototype.mapcss_checkSubject = function(subject) {
    return subject == this.properties.type || subject == '*';
}
turbo.GeoJson.Feature.prototype.mapcss_getParentObjects = function() {
    return this.getParents(); // todo
}

/** Point Feature Class **/

turbo.GeoJson.PointFeature = function( id, type, coordinates ) {
    // call inherited constructor
    turbo.GeoJson.Feature.call( this, id, type );
    // set geometry
    this.geometry = {
        type: 'Point',
        coordinates: coordinates
    };
};

turbo.GeoJson.PointFeature.prototype = new turbo.GeoJson.Feature();

turbo.GeoJson.PointFeature.prototype.mapcss_checkSubject = function(subject) {
    return subject == this.properties.type || subject == 'point' || subject == '*';
}

/** LineString Feature Class **/

turbo.GeoJson.LineStringFeature = function( id, type, coordinates ) {
    // call inherited constructor
    turbo.GeoJson.Feature.call( this, id, type );
    // set geometry
    this.geometry = {
        type: 'LineString',
        coordinates: coordinates
    };
};

turbo.GeoJson.LineStringFeature.prototype = new turbo.GeoJson.Feature();

turbo.GeoJson.PointFeature.prototype.mapcss_checkSubject = function(subject) {
    return subject == this.properties.type || subject == 'line' || subject == '*';
}

/** Polygon Feature Class **/

turbo.GeoJson.PolygonFeature = function( id, type, coordinates ) {
    // call inherited constructor
    turbo.GeoJson.Feature.call( this, id, type );
    // set geometry
    this.geometry = {
        type: 'Polygon',
        coordinates: coordinates
    };
};

turbo.GeoJson.PolygonFeature.prototype = new turbo.GeoJson.Feature();

turbo.GeoJson.PointFeature.prototype.mapcss_checkSubject = function(subject) {
    return subject == this.properties.type || subject == 'area' || subject == '*';
}

/** MultiPolygon Feature Class **/

turbo.GeoJson.MultiPolygonFeature = function( id, type, coordinates ) {
    // call inherited constructor
    turbo.GeoJson.Feature.call( this, id, type );
    // set geometry
    this.geometry = {
        type: 'MultiPolygon',
        coordinates: coordinates
    };
};

turbo.GeoJson.MultiPolygonFeature.prototype = new turbo.GeoJson.Feature();

turbo.GeoJson.PointFeature.prototype.mapcss_checkSubject = function(subject) {
    return subject == this.properties.type || subject == 'area' || subject == '*';
}

turbo.geoJson = {};

/** Feature Base Class **/

turbo.geoJson.Feature = function( type, id ) {
    this.properties = {
        type: type,
        id: id,
        tags: {},
        flags: {},
        meta: {}
    };
    this.partents = [];
};

turbo.geoJson.Feature.prototype.properties = null;
turbo.geoJson.Feature.prototype.geometry = null;
turbo.geoJson.Feature.prototype.style = null;
turbo.geoJson.Feature.prototype.partents = null;

turbo.geoJson.Feature.prototype.setTags = function(tags) {
    this.properties.tags = tags;
};
turbo.geoJson.Feature.prototype.getTags = function() {
    return this.properties.tags;
};
turbo.geoJson.Feature.prototype.setTag = function( tag, value ) {
    this.properties.tags[tag] = value;
};
turbo.geoJson.Feature.prototype.getTag = function(tag) {
    if ( !this.properties.tags )
        return undefined;
    return this.properties.tags[tag];
};
turbo.geoJson.Feature.prototype.setMeta = function(meta) {
    this.properties.meta = meta;
};
turbo.geoJson.Feature.prototype.getMeta = function() {
    return this.properties.meta;
};
turbo.geoJson.Feature.prototype.setRelations = function(relations) {
    this.properties.relations = relations;
};
turbo.geoJson.Feature.prototype.getRelations = function() {
    return this.properties.relations;
};
turbo.geoJson.Feature.prototype.setStyle = function(style) {
    this.style = style;
};
turbo.geoJson.Feature.prototype.getStyle = function() {
    return this.style;
};
turbo.geoJson.Feature.prototype.setFlag = function( flag, value ) {
    this.flags[flag] = value;
};
turbo.geoJson.Feature.prototype.getFlag = function(flag) {
    return this.flags[flag];
};
turbo.geoJson.Feature.prototype.addParent = function(parent) {
    this.parents.push(parent);
}
turbo.geoJson.Feature.prototype.getParents = function(parent) {
    return this.parents;
}

turbo.geoJson.Feature.prototype.hasInterestingTags = function() {
    if ( !this.properties.tags )
        return false;
    return _.any( this.properties.tags, function(v,k) { return k!='created_by' || k!='source'; })
};

/* mapcss routines */
turbo.geoJson.Feature.prototype.mapcss_getAttributes = function() { // todo: add a more general "flat properties" method and use that
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
turbo.geoJson.Feature.prototype.mapcss_checkSubject = function(subject) {
    return subject == this.properties.type || subject == '*';
}
turbo.geoJson.Feature.prototype.mapcss_getParentObjects = function() {
    return this.getParents(); // todo
}

/** Point Feature Class **/

turbo.geoJson.PointFeature = function( type, id, coordinates ) {
    // call inherited constructor
    turbo.geoJson.Feature.call( this, type, id );
    // set geometry
    this.geometry = {
        type: 'Point',
        coordinates: coordinates
    };
};

turbo.geoJson.PointFeature.prototype = new turbo.geoJson.Feature();

turbo.geoJson.PointFeature.prototype.mapcss_checkSubject = function(subject) {
    return subject == this.properties.type || subject == 'point' || subject == '*';
}

/** LineString Feature Class **/

turbo.geoJson.LineStringFeature = function( type, id, coordinates ) {
    // call inherited constructor
    turbo.geoJson.Feature.call( this, type, id );
    // set geometry
    this.geometry = {
        type: 'LineString',
        coordinates: coordinates
    };
};

turbo.geoJson.LineStringFeature.prototype = new turbo.geoJson.Feature();

turbo.geoJson.PointFeature.prototype.mapcss_checkSubject = function(subject) {
    return subject == this.properties.type || subject == 'line' || subject == '*';
}

/** Polygon Feature Class **/

turbo.geoJson.PolygonFeature = function( type, id, coordinates ) {
    // call inherited constructor
    turbo.geoJson.Feature.call( this, type, id );
    // set geometry
    this.geometry = {
        type: 'Polygon',
        coordinates: coordinates
    };
};

turbo.geoJson.PolygonFeature.prototype = new turbo.geoJson.Feature();

turbo.geoJson.PointFeature.prototype.mapcss_checkSubject = function(subject) {
    return subject == this.properties.type || subject == 'area' || subject == '*';
}

/** MultiPolygon Feature Class **/

turbo.geoJson.MultiPolygonFeature = function( type, id, coordinates ) {
    // call inherited constructor
    turbo.geoJson.Feature.call( this, type, id );
    // set geometry
    this.geometry = {
        type: 'MultiPolygon',
        coordinates: coordinates
    };
};

turbo.geoJson.MultiPolygonFeature.prototype = new turbo.geoJson.Feature();

turbo.geoJson.PointFeature.prototype.mapcss_checkSubject = function(subject) {
    return subject == this.properties.type || subject == 'area' || subject == '*';
}

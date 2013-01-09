L.OverlayPopup = L.Popup.extend({
  onAdd: function(map) {
    this._map = map;

    if (!this._container) {
      this._initLayout();
    }
    this._updateContent();

    var animFade = map.options.fadeAnimation;

    if (animFade) {
      L.DomUtil.setOpacity(this._container, 0);
    }
    map._controlContainer.appendChild(this._container);

    map.on('viewreset', this._updatePosition, this);

    if (L.Browser.any3d) {
      map.on('zoomanim', this._zoomAnimation, this)
    }

    if (map.options.closePopupOnClick) {
      map.on('preclick', this._close, this);
    }

    this._update();

    if (animFade) {
      L.DomUtil.setOpacity(this._container, 1);
    }
  },
  onRemove: function (map) {
    map._controlContainer.removeChild(this._container);

    L.Util.falseFn(this._container.offsetWidth); // force reflow

    map.off({
      viewreset: this._updatePosition,
      preclick: this._close,
      zoomanim: this._zoomAnimation
    }, this);

    if (map.options.fadeAnimation) {
      L.DomUtil.setOpacity(this._container, 0);
    }

    this._map = null;
  },
  _initLayout: function() {
    var prefix = 'leaflet-popup',
      containerClass = prefix + ' ' + this.options.className + ' leaflet-zoom-animated',
      container = this._container = L.DomUtil.create('div', containerClass),
      closeButton;

    var wrapper = this._wrapper =
      L.DomUtil.create('div', prefix + '-content-wrapper', container);
    L.DomEvent.disableClickPropagation(wrapper);

    if (this.options.closeButton) {
      closeButton = this._closeButton =
        L.DomUtil.create('a', prefix + '-close-button', container);
      closeButton.href = '#close';
      closeButton.innerHTML = '&#215;';

      L.DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this);
    }

    this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);
    L.DomEvent.on(this._contentNode, 'mousewheel', L.DomEvent.stopPropagation);

    // no tip for this kind of popup ;)
  },
  _updatePosition: function () {
     if (!this._map) { return; }

     var pos = this._map.latLngToLayerPoint(this._latlng),
         is3d = L.Browser.any3d,
         offset = this.options.offset;

     // do not setPosition to any latlng

     this._containerBottom = -offset.y - (is3d ? 0 : pos.y);
     this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x + (is3d ? 0 : pos.x);

     //Bottom position the popup in case the height of the popup changes (images loading etc)
     this._container.style.top = '16px';
     this._container.style.right = '16px';
   },
   _adjustPan: function () {
    // do not adjust Pan for this kind of popup!
  },
});

L.overlayPopup = function (options, source) {
  return new L.OverlayPopup(options, source);
};

/*
 * Round icon with some letters on it.
 */
L.LetterIcon = L.Icon.extend({
	options: {
		className: 'leaflet-div-icon',
		color: 'black',
		radius: 11
	},

	initialize: function(letter, options) {
		this._letter = letter;
		L.setOptions(this, options);
	},

	createIcon: function() {
		var radius = this.options.radius,
			diameter = radius * 2 + 1;
		var div = document.createElement('div');
		div.innerHTML = this._letter;
		div.className = 'leaflet-marker-icon';
		div.style.marginLeft = (-radius-2) + 'px';
		div.style.marginTop  = (-radius-2) + 'px';
		div.style.width      = diameter + 'px';
		div.style.height     = diameter + 'px';
		div.style.borderRadius = (radius + 2) + 'px';
		div.style.borderWidth = '2px';
		div.style.borderColor = 'white';
		div.style.fontSize   = '10px';
		div.style.fontFamily = 'sans-serif';
		div.style.fontWeight = 'bold';
		div.style.textAlign  = 'center';
		div.style.lineHeight = diameter + 'px';
		div.style.color      = 'white';
		div.style.backgroundColor = this.options.color;
		this._setIconStyles(div, 'icon');
		return div;
	},

	createShadow: function() { return null; }
});

L.letterIcon = function(letter, options) {
	return new L.LetterIcon(letter, options);
};

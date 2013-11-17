/*
 * Small popup-like icon to replace big L.Popup
 */

L.PopupIcon = L.Icon.extend({
	options: {
		width: 150
	},
	
	initialize: function( text, options ){
		L.Icon.prototype.initialize.call(this, options);
		this._text = text;
	},

	createIcon: function() {
		var pdiv = document.createElement('div'),
			div = document.createElement('div'),
			width = this.options.width;

		pdiv.style.position = 'absolute';
		div.style.position = 'absolute';
		div.style.width = width + 'px';
		div.style.bottom = '-3px';
		div.style.left = (-width / 2) + 'px';

		var contentDiv = document.createElement('div');
		contentDiv.innerHTML = this._text;
		contentDiv.style.textAlign = 'center';
		contentDiv.style.lineHeight = '1.2';
		contentDiv.style.backgroundColor = 'white';
		contentDiv.style.boxShadow = '0px 1px 10px rgba(0, 0, 0, 0.655)';
		contentDiv.style.padding = '4px 7px';
		contentDiv.style.borderRadius = '5px';
		contentDiv.style.margin = '0 auto';
		contentDiv.style.display = 'table';

		var tipcDiv = document.createElement('div');
		tipcDiv.className = 'leaflet-popup-tip-container';
		tipcDiv.style.width = '20px';
		tipcDiv.style.height = '11px';
		var tipDiv = document.createElement('div');
		tipDiv.className = 'leaflet-popup-tip';
		tipDiv.style.width = tipDiv.style.height = '8px';
		tipDiv.style.marginTop = '-5px';
		tipDiv.style.boxShadow = 'none';
		tipcDiv.appendChild(tipDiv);
		
		div.appendChild(contentDiv);
		div.appendChild(tipcDiv);
		pdiv.appendChild(div);
		return pdiv;
	},
	
	createShadow: function () {
		return null;
	}
});

L.popupIcon = function (text, options) {
	return new L.PopupIcon(text, options);
};

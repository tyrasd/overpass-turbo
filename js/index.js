import $ from 'jquery';
import 'jquery-ui';

import 'leaflet';
import 'leaflet-polylineoffset';
import 'leaflet.locationfilter';

import 'codemirror/lib/codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/css/css';
import 'codemirror/lib/util/multiplex';
import 'codemirror/lib/util/closetag';

// include the CSS files
import 'codemirror/lib/codemirror.css';
import 'leaflet/dist/leaflet.css';
// import 'leaflet.locationfilter/src/locationfilter.css';
import 'jquery-ui/themes/base/jquery-ui.css';
import '../css/default.css';
import '../css/compact.css';

// initialize ide on document ready
import ide from './ide';
$(document).ready(ide.init);


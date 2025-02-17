/*! leaflet.elevation 02-03-2016 */
L.Control.Elevation = L.Control.extend({
	options: {
		position: "topright",
		theme: "lime-theme",
		width: 600,
		height: 175,
		margins: {
			top: 10,
			right: 20,
			bottom: 30,
			left: 60
		},
		useHeightIndicator: !0,
		interpolation: "linear",
		hoverNumber: {
			decimalsX: 3,
			decimalsY: 0,
			formatter: void 0
		},
		xTicks: void 0,
		yTicks: void 0,
		collapsed: !1,
		yAxisMin: void 0,
		yAxisMax: void 0,
		forceAxisBounds: !1,
		controlButton: {
			iconCssClass: "elevation-toggle-icon",
			title: "Elevation"
		},
		imperial: !1
	},
	__mileFactor: .621371,
	__footFactor: 3.28084,
	onRemove: function(a) {
		this._container = null
	},
	onAdd: function(a) {
		this._map = a;
		var b = this.options,
			c = b.margins;
		b.xTicks = b.xTicks || Math.round(this._width() / 75), b.yTicks = b.yTicks || Math.round(this._height() / 30), b.hoverNumber.formatter = b.hoverNumber.formatter || this._formatter;
		var d = this._x = d3.scale.linear().range([0, this._width()]),
			e = this._y = d3.scale.linear().range([this._height(), 0]),
			f = (this._area = d3.svg.area().interpolate(b.interpolation).x(function(a) {
				var b = d(a.dist);
				return a.xDiagCoord = b, b
			}).y0(this._height()).y1(function(a) {
				return e(a.altitude)
			}), this._container = L.DomUtil.create("div", "elevation"));
		L.DomUtil.addClass(f, b.theme), this._initToggle();
		var g = d3.select(f);
		g.attr("width", b.width);
		var h = g.append("svg");
		h.attr("width", b.width).attr("class", "background").attr("height", b.height).append("g").attr("transform", "translate(" + c.left + "," + c.top + ")");
		var i = d3.svg.line();
		i = i.x(function(a) {
			return d3.mouse(h.select("g"))[0]
		}).y(function(a) {
			return this._height()
		});
		var j = d3.select(this._container).select("svg").select("g");
		this._areapath = j.append("path").attr("class", "area");
		var k = this._background = j.append("rect").attr("width", this._width()).attr("height", this._height()).style("fill", "none").style("stroke", "none").style("pointer-events", "all");
		L.Browser.mobile ? (k.on("touchmove.drag", this._dragHandler.bind(this)).on("touchstart.drag", this._dragStartHandler.bind(this)).on("touchstart.focus", this._mousemoveHandler.bind(this)), L.DomEvent.on(this._container, "touchend", this._dragEndHandler, this)) : (k.on("mousemove.focus", this._mousemoveHandler.bind(this)).on("mouseout.focus", this._mouseoutHandler.bind(this)).on("mousedown.drag", this._dragStartHandler.bind(this)).on("mousemove.drag", this._dragHandler.bind(this)), L.DomEvent.on(this._container, "mouseup", this._dragEndHandler, this)), this._xaxisgraphicnode = j.append("g"), this._yaxisgraphicnode = j.append("g"), this._appendXaxis(this._xaxisgraphicnode), this._appendYaxis(this._yaxisgraphicnode);
		var l = this._focusG = j.append("g");
		return this._mousefocus = l.append("svg:line").attr("class", "mouse-focus-line").attr("x2", "0").attr("y2", "0").attr("x1", "0").attr("y1", "0"), this._focuslabelX = l.append("svg:text").style("pointer-events", "none").attr("class", "mouse-focus-label-x"), this._focuslabelY = l.append("svg:text").style("pointer-events", "none").attr("class", "mouse-focus-label-y"), this._data && this._applyData(), f
	},
	_dragHandler: function() {
		d3.event.preventDefault(), d3.event.stopPropagation(), this._gotDragged = !0, this._drawDragRectangle()
	},
	_drawDragRectangle: function() {
		if (this._dragStartCoords) {
			var a = this._dragCurrentCoords = d3.mouse(this._background.node()),
				b = Math.min(this._dragStartCoords[0], a[0]),
				c = Math.max(this._dragStartCoords[0], a[0]);
			if (this._dragRectangle || this._dragRectangleG) this._dragRectangle.attr("width", c - b).attr("x", b);
			else {
				var d = d3.select(this._container).select("svg").select("g");
				this._dragRectangleG = d.append("g"), this._dragRectangle = this._dragRectangleG.append("rect").attr("width", c - b).attr("height", this._height()).attr("x", b).attr("class", "mouse-drag").style("pointer-events", "none")
			}
		}
	},
	_resetDrag: function() {
		this._dragRectangleG && (this._dragRectangleG.remove(), this._dragRectangleG = null, this._dragRectangle = null, this._hidePositionMarker(), this._map.fitBounds(this._fullExtent))
	},
	_dragEndHandler: function() {
		if (!this._dragStartCoords || !this._gotDragged) return this._dragStartCoords = null, this._gotDragged = !1, void this._resetDrag();
		this._hidePositionMarker();
		var a = this._findItemForX(this._dragStartCoords[0]),
			b = this._findItemForX(this._dragCurrentCoords[0]);
		this._fitSection(a, b), this._dragStartCoords = null, this._gotDragged = !1;
		console.log(a,b);
	},
	_dragStartHandler: function() {
		d3.event.preventDefault(), d3.event.stopPropagation(), this._gotDragged = !1, this._dragStartCoords = d3.mouse(this._background.node())
	},
	_findItemForX: function(a) {
		var b = d3.bisector(function(a) {
				return a.dist
			}).left,
			c = this._x.invert(a);
		return b(this._data, c)
	},
	_findItemForLatLng: function(a) {
		var b = null,
			c = 1 / 0;
		return this._data.forEach(function(d) {
			var e = a.distanceTo(d.latlng);
			c > e && (c = e, b = d)
		}), b
	},
	_fitSection: function(a, b) {
		var c = Math.min(a, b),
			d = Math.max(a, b),
			e = this._calculateFullExtent(this._data.slice(c, d));
		this._map.fitBounds(e)
	},
	_initToggle: function() {
		var a = this._container;
		if (a.setAttribute("aria-haspopup", !0), L.Browser.mobile ? L.DomEvent.on(a, "click", L.DomEvent.stopPropagation) : L.DomEvent.disableClickPropagation(a), this.options.collapsed) {
			this._collapse(), L.Browser.android || L.DomEvent.on(a, "mouseover", this._expand, this).on(a, "mouseout", this._collapse, this);
			var b = this._button = L.DomUtil.create("a", "elevation-toggle " + this.options.controlButton.iconCssClass, a);
			b.href = "#", b.title = this.options.controlButton.title, L.Browser.mobile ? L.DomEvent.on(b, "click", L.DomEvent.stop).on(b, "click", this._expand, this) : L.DomEvent.on(b, "focus", this._expand, this), this._map.on("click", this._collapse, this)
		}
	},
	_expand: function() {
		this._container.className = this._container.className.replace(" elevation-collapsed", "")
	},
	_collapse: function() {
		L.DomUtil.addClass(this._container, "elevation-collapsed")
	},
	_width: function() {
		var a = this.options;
		return a.width - a.margins.left - a.margins.right
	},
	_height: function() {
		var a = this.options;
		return a.height - a.margins.top - a.margins.bottom
	},
	_formatter: function(a, b, c) {
		var d;
		d = 0 === b ? Math.round(a) + "" : L.Util.formatNum(a, b) + "";
		var e = d.split(".");
		if (e[1]) {
			for (var f = b - e[1].length; f > 0; f--) e[1] += "0";
			d = e.join(c || ".")
		}
		return d
	},
	_appendYaxis: function(a) {
		var b = this.options;
		b.imperial ? a.attr("class", "y axis").call(d3.svg.axis().scale(this._y).ticks(this.options.yTicks).orient("left")).append("text").attr("x", -37).attr("y", 3).style("text-anchor", "end").text("ft") : a.attr("class", "y axis").call(d3.svg.axis().scale(this._y).ticks(this.options.yTicks).orient("left")).append("text").attr("x", -45).attr("y", 3).style("text-anchor", "end").text("m")
	},
	_appendXaxis: function(a) {
		var b = this.options;
		b.imperial ? a.attr("class", "x axis").attr("transform", "translate(0," + this._height() + ")").call(d3.svg.axis().scale(this._x).ticks(this.options.xTicks).orient("bottom")).append("text").attr("x", this._width() + 10).attr("y", 15).style("text-anchor", "end").text("mi") : a.attr("class", "x axis").attr("transform", "translate(0," + this._height() + ")").call(d3.svg.axis().scale(this._x).ticks(this.options.xTicks).orient("bottom")).append("text").attr("x", this._width() + 20).attr("y", 15).style("text-anchor", "end").text("km")
	},
	_updateAxis: function() {
		this._xaxisgraphicnode.selectAll("g").remove(), this._xaxisgraphicnode.selectAll("path").remove(), this._xaxisgraphicnode.selectAll("text").remove(), this._yaxisgraphicnode.selectAll("g").remove(), this._yaxisgraphicnode.selectAll("path").remove(), this._yaxisgraphicnode.selectAll("text").remove(), this._appendXaxis(this._xaxisgraphicnode), this._appendYaxis(this._yaxisgraphicnode)
	},
	_mouseoutHandler: function() {
		this._hidePositionMarker()
	},
	_hidePositionMarker: function() {
		this._marker && (this._map.removeLayer(this._marker), this._marker = null), this._mouseHeightFocus && (this._mouseHeightFocus.style("visibility", "hidden"), this._mouseHeightFocusLabel.style("visibility", "hidden")), this._pointG && this._pointG.style("visibility", "hidden"), this._focusG.style("visibility", "hidden")
	},
	_mousemoveHandler: function(a, b, c) {
		if (this._data && 0 !== this._data.length) {
			var d = d3.mouse(this._background.node()),
				e = this.options,
				f = this._data[this._findItemForX(d[0])],
				g = f.altitude,
				h = f.dist,
				i = f.latlng,
				j = e.hoverNumber.formatter(g, e.hoverNumber.decimalsY);
			e.hoverNumber.formatter(h, e.hoverNumber.decimalsX);
			this._showDiagramIndicator(f, d[0]);
			var k = this._map.latLngToLayerPoint(i);
			if (e.useHeightIndicator) {
				if (!this._mouseHeightFocus) {
					var l = d3.select(".leaflet-overlay-pane svg").append("g");
					this._mouseHeightFocus = l.append("svg:line").attr("class", e.theme + " height-focus line").attr("x2", 0).attr("y2", 0).attr("x1", 0).attr("y1", 0);
					var m = this._pointG = l.append("g");
					m.append("svg:circle").attr("r", 6).attr("cx", 0).attr("cy", 0).attr("class", e.theme + " height-focus circle-lower"), this._mouseHeightFocusLabel = l.append("svg:text").attr("class", e.theme + " height-focus-label").style("pointer-events", "none")
				}
				var n = this._height() / this._maxElevation * g,
					o = k.y - n;
				this._mouseHeightFocus.attr("x1", k.x).attr("x2", k.x).attr("y1", k.y).attr("y2", o).style("visibility", "visible"), this._pointG.attr("transform", "translate(" + k.x + "," + k.y + ")").style("visibility", "visible"), e.imperial ? this._mouseHeightFocusLabel.attr("x", k.x).attr("y", o).text(j + " ft").style("visibility", "visible") : this._mouseHeightFocusLabel.attr("x", k.x).attr("y", o).text(j + " m").style("visibility", "visible")
			} else this._marker ? this._marker.setLatLng(i) : this._marker = new L.Marker(i).addTo(this._map)
		}
	},
	_addGeoJSONData: function(a) {
		var b = this.options;
		if (a) {
			for (var c = this._data || [], d = this._dist || 0, e = this._maxElevation || 0, f = 0; f < a.length; f++) {
				var g = new L.LatLng(a[f][1], a[f][0]),
					h = new L.LatLng(a[f ? f - 1 : 0][1], a[f ? f - 1 : 0][0]),
					i = b.imperial ? g.distanceTo(h) * this.__mileFactor : g.distanceTo(h);
				d += Math.round(i / 1e3 * 1e5) / 1e5, e = e < a[f][2] ? a[f][2] : e, c.push({
					dist: d,
					altitude: b.imperial ? a[f][2] * this.__footFactor : a[f][2],
					x: a[f][0],
					y: a[f][1],
					latlng: g
				})
			}
			this._dist = d, this._data = c, e = b.imperial ? e * this.__footFactor : e, this._maxElevation = e
		}
	},
	_addGPXdata: function(a) {
		var b = this.options;
		if (a) {
			for (var c = this._data || [], d = this._dist || 0, e = this._maxElevation || 0, f = 0; f < a.length; f++) {
				var g = a[f],
					h = a[f ? f - 1 : 0],
					i = b.imperial ? g.distanceTo(h) * this.__mileFactor : g.distanceTo(h);
				d += Math.round(i / 1e3 * 1e5) / 1e5, e = e < g.meta.ele ? g.meta.ele : e, c.push({
					dist: d,
					altitude: b.imperial ? g.meta.ele * this.__footFactor : g.meta.ele,
					x: g.lng,
					y: g.lat,
					latlng: g
				})
			}
			this._dist = d, this._data = c, e = b.imperial ? e * this.__footFactor : e, this._maxElevation = e
		}
	},
	_addData: function(a) {
		var b, c = a && a.geometry && a.geometry;
		if (c) switch (c.type) {
			case "LineString":
				this._addGeoJSONData(c.coordinates);
				break;
			case "MultiLineString":
				for (b = 0; b < c.coordinates.length; b++) this._addGeoJSONData(c.coordinates[b]);
				break;
			default:
				throw new Error("Invalid GeoJSON object.")
		}
		var d = a && "FeatureCollection" === a.type;
		if (d)
			for (b = 0; b < a.features.length; b++) this._addData(a.features[b]);
		a && a._latlngs && this._addGPXdata(a._latlngs)
	},
	_calculateFullExtent: function(a) {
		if (!a || a.length < 1) throw new Error("no data in parameters");
		var b = new L.latLngBounds(a[0].latlng, a[0].latlng);
		return a.forEach(function(a) {
			b.extend(a.latlng)
		}), b
	},
	addData: function(a, b) {
		this._addData(a), this._container && this._applyData(), null === b && a.on && (b = a), b && b.on("mousemove", this._handleLayerMouseOver.bind(this))
	},
	_handleLayerMouseOver: function(a) {
		if (this._data && 0 !== this._data.length) {
			var b = a.latlng,
				c = this._findItemForLatLng(b);
			if (c) {
				var d = c.xDiagCoord;
				this._showDiagramIndicator(c, d)
			}
		}
	},
	_showDiagramIndicator: function(a, b) {
		var c = this.options;
		this._focusG.style("visibility", "visible"), this._mousefocus.attr("x1", b).attr("y1", 0).attr("x2", b).attr("y2", this._height()).classed("hidden", !1);
		var d = a.altitude,
			e = a.dist,
			f = (a.latlng, c.hoverNumber.formatter(d, c.hoverNumber.decimalsY)),
			g = c.hoverNumber.formatter(e, c.hoverNumber.decimalsX);
		c.imperial ? (this._focuslabelX.attr("x", b).text(f + " ft"), this._focuslabelY.attr("y", this._height() - 5).attr("x", b).text(g + " mi")) : (this._focuslabelX.attr("x", b).text(f + " m"), this._focuslabelY.attr("y", this._height() - 5).attr("x", b).text(g + " km"))
	},
	_applyData: function() {
		var a = d3.extent(this._data, function(a) {
				return a.dist
			}),
			b = d3.extent(this._data, function(a) {
				return a.altitude
			}),
			c = this.options;
		void 0 !== c.yAxisMin && (c.yAxisMin < b[0] || c.forceAxisBounds) && (b[0] = c.yAxisMin), void 0 !== c.yAxisMax && (c.yAxisMax > b[1] || c.forceAxisBounds) && (b[1] = c.yAxisMax), this._x.domain(a), this._y.domain(b), this._areapath.datum(this._data).attr("d", this._area), this._updateAxis(), this._fullExtent = this._calculateFullExtent(this._data)
	},
	_clearData: function() {
		this._data = null, this._dist = null, this._maxElevation = null
	},
	clear: function() {
		this._clearData(), this._areapath && (this._areapath.attr("d", "M0 0"), this._x.domain([0, 1]), this._y.domain([0, 1]), this._updateAxis())
	},
	hide: function() {
		this._container.style.display = "none"
	},
	show: function() {
		this._container.style.display = "block"
	}
}), L.control.elevation = function(a) {
	return new L.Control.Elevation(a)
};

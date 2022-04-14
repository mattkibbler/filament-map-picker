import * as L from 'leaflet/src/Leaflet';

window.mapPicker = ($wire, config) => {
    return {
        map: null,
        tile: null,
        marker: null,
        createMap: function (el) {

            const that = this;

            this.map = L.map(el, config.controls);
            this.map.on('load', () => {
                setTimeout(() => this.map.invalidateSize(true), 0);
                if (config.showMarker === true) {
                    this.marker.setLatLng(this.map.getCenter())
                }
            })

            if (!config.draggable) {
                this.map.dragging.disable();
            }

            this.tile = L.tileLayer(config.tilesUrl, {
                attribution: config.attribution,
                minZoom: config.minZoom,
                maxZoom: config.maxZoom,
                tileSize: config.tileSize,
                zoomOffset: config.zoomOffset,
                detectRetina: config.detectRetina,
            }).addTo(this.map);


            if (config.showMarker === true) {
				const markerOptions = config.markerOptions || {};
                this.marker = L.marker([0, 0], {
                    draggable: false,
                    autoPan: true,
					...markerOptions,
                }).addTo(this.map)
                this.map.on('move', () => this.marker.setLatLng(this.map.getCenter()))
            }

            this.map.on('moveend', () => {
                let coordinates = this.getCoordinates();
                if (config.draggable && (coordinates.lng !== this.map.getCenter()['lng'] || coordinates.lat !== this.map.getCenter()['lat'])) {
                    $wire.set(config.statePath, this.map.getCenter(), true)
                }
            })

            this.map.on('locationfound', function () {
                that.map.setZoom(config.controls.zoom)
            });
            let location = this.getCoordinates();
            if (!location.lat && !location.lng) {
                this.map.locate({
                    setView: true,
                    maxZoom: config.controls.maxZoom,
                    enableHighAccuracy: true,
                    watch: false
                });
            } else {
                this.map.setView(new L.LatLng(location.lat, location.lng))
            }
        },
        removeMap: function (el) {

            if (this.marker) {
                this.marker.remove();
                this.marker = null
            }
            this.tile.remove();
            this.tile = null
            this.map.off()
            this.map.remove();
            this.map = null
        },
        getCoordinates: function () {
            let location = $wire.get(config.statePath)
            if (location === null || !location.hasOwnProperty('lat')) {
                location = {lat: 0, lng: 0}
            }
            return location;
        },
        attach: function (el) {

            this.createMap(el)
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.intersectionRatio > 0) {
                        if (!this.map)
                            this.createMap(el)
                    } else {
                        this.removeMap(el)
                    }
                });
            }, {
                root: null, // set document viewport as root
                rootMargin: '0px', // margin around root
                threshold: 1.0 // 1.0 means that when 100% of the target is visible
                //inside the root, then observer callback is invoked.
            });
            observer.observe(el);
        }
    }
}
window.dispatchEvent(new CustomEvent('map-script-loaded'));

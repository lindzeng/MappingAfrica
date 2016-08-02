function init() {
    // Mouse Position
    var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(3),
        projection: 'EPSG:4326',
        undefinedHTML: '&nbsp;'
    });

        // Create a group for image overlays and push layers on later
    var overlayGroup = new ol.layer.Group({
        title: 'Image Overlays',
        layers: []
    });
        
        // Map
    var map = new ol.Map({
        controls: ol.control.defaults({
            attributionOptions:  ({
                collapsible: false
            })
        }).extend([mousePositionControl]),
        layers: [
            new ol.layer.Group({
                title: 'Base map',
                layers: [
                    new ol.layer.Tile({
                        title: 'Mapbox Satellite Imagery',
                        type: 'base',
                        visible: false,
                        source: new ol.source.XYZ({
                            attributions: '&copy; <a href="https://www.mapbox.com/map-feedback/">Mapbox</a>',
                            tileSize: [512, 512],
                            url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGluZHplbmciLCJhIjoiY2lwNzJ0amIwMDBqN3Q2bHl5anJqZXowbyJ9.dauHM2mZRuajvxcAOALHsA'
                        })
                    }),
                    new ol.layer.Tile({
                        title: 'Bing Satellite Imagery',
                        type: 'base',
                        visible: true,
                        source: new ol.source.BingMaps({
                            key: 'esMqD5pajkiIvp26krWq~xK2nID-glxBU5PYtVmuoMw~AhanXg6fK3a8vRhyc1O-FgeHTWfzerYO4ptmwz9eGjcUh53y7Zu5cU4BT_en6fzW',
                            imagerySet: 'Aerial'
                            
                        })
                    })
                ]
            }),
            overlayGroup
        ],
        target: document.getElementById('map'),
        view: new ol.View({
            // The center coordinate should be passed as a parameter in init()
            // If excluded, the map won't load
            center: ol.proj.fromLonLat([26.9061152624, -12.0563896545]),
            zoom: 15,
            minZoom: 14,
            maxZoom: 17
        })
    });
    
    // Zoom control
    var zoomslider = new ol.control.ZoomSlider();
    
    // Layer Switcher control (OL3 doesn't have one, using another script)
    var layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: 'Layer Switcher'
    });
    
    map.addControl(zoomslider);
    map.addControl(layerSwitcher);
    
    // Satellite image overlays obtained as WMS sources from GeoServer
    var trueColor = new ol.source.ImageWMS({
        url: 'http://localhost:8080/geoserver/MappingAfrica/wms',
        params: {
            layers: 'MappingAfrica:test1_scaled_warp',
            styles: 'true_color'
        },
        serverType: 'geoserver'
    });
    var trueColor_overlay = new ol.layer.Image({
        title: 'True Color',
        source: trueColor,
        visible: false,
    });
    
    var falseColor = new ol.source.ImageWMS({
        url: 'http://localhost:8080/geoserver/MappingAfrica/wms',
        params: {
                layers: 'MappingAfrica:test1_scaled_warp',
                styles: 'false_color'
            },
        serverType: 'geoserver'
    });
    var falseColor_overlay = new ol.layer.Image({
        title: 'False Color',
        source: falseColor,
        visible: false
    });
    
    overlayGroup.getLayers().push(falseColor_overlay);
    overlayGroup.getLayers().push(trueColor_overlay);
    
    //map.getView().fit(trueColor_overlay.getExtent(), (map.getSize()));
    
    // Toolbar and Mapped Fields layer
    var fields = new ol.Collection();
    var fieldsLayer = new ol.layer.Vector({
        source: new ol.source.Vector({features: fields}),
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                })
            })
        })
    });
    fieldsLayer.setMap(map); 
    
    var modify = new ol.interaction.Modify({
        features: fields,
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                }),
                stroke: new ol.style.Stroke({
                    color: 'white',
                    width: 2
                })
            })
        }) 
    });
    
    var text = document.getElementById('text');
    var typeSelect = document.getElementById('geom_type');
    var draw, select, drawOn, selectOn;
    var deleteMode = document.getElementById('delete');
    var drawMode = document.getElementById('draw');
    var noneMode = document.getElementById('none');
    var deleteOne = document.getElementById('delete_one');
    
    function addDrawInteraction() {
        var value = typeSelect.value;
        var geometryFunction, maxPoints;

        if (value === 'Circle') {
            // Create circle from polygon, otherwise not recognized by KML
            geometryFunction = ol.interaction.Draw.createRegularPolygon();
        } 
        if (value === 'Rectangle') {
            // Use diagonal to form rectangle
            value = 'LineString';
            maxPoints = 2;
            // geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
            geometryFunction = function(coordinates, geometry) {
                if (!geometry) {
                    geometry = new ol.geom.Polygon(null);
                }
                var start = coordinates[0];
                var end = coordinates[1];
                geometry.setCoordinates([
                    [start, [start[0], end[1]], end, [end[0], start[1]], start]
                ]);
                return geometry;
            }; 
        }
        
        draw = new ol.interaction.Draw({
            features: fields,
            type: value,
            geometryFunction: geometryFunction,
            maxPoints: maxPoints,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)',
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 153, 255, 1.0)',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: 'rgba(0, 153, 255, 0.5)'
                    })
                })
            })
        });
        map.addInteraction(draw);
        drawOn = true;
        map.removeInteraction(select);
        selectOn = false;
        map.addInteraction(modify);
        text.innerHTML = "<b>DRAW TOOL:</b> Choose geometry type for mapping.";
        typeSelect.disabled = false;
        drawMode.disabled = true;
        deleteMode.disabled = false;
        noneMode.disabled = false;
        deleteOne.disabled = true;
    }
    
    // When geometry selection has changed
    typeSelect.onchange = function() {
        map.removeInteraction(draw);
        addDrawInteraction();
    };
    
    function addDeleteInteraction() {
        select = new ol.interaction.Select({
            condition: function(event) {
                return ol.events.condition.singleClick(event);
            }
        });
        
        map.addInteraction(select);
        selectOn = true;
        map.removeInteraction(modify);
        map.removeInteraction(draw);
        drawOn = false;
        
        text.innerHTML = "<b>DELETE TOOL:</b> First, single click to select the field you want to delete. To delete, press 'd' or click on the eraser icon below.";
        
        typeSelect.disabled = true;
        drawMode.disabled = false;
        deleteMode.disabled = true;
        noneMode.disabled = false;
        deleteOne.disabled = false;
    }
    
    // Keyboard interactions
    $(document).keyup(function(event) {
        // DRAW/DELETE
        if (event.keyCode == 16) /* SHIFT key */ {
            if (drawOn == true) {
                addDeleteInteraction();
            } else {
                addDrawInteraction();
            }
        }
        
        // NONE 
        if (event.keyCode == 83) /* 's' key */ {
            map.removeInteraction(draw);
            drawOn = false;
            map.removeInteraction(select);
            selectOn = false;
            text.innerHTML = "<b>NO TOOL IN USE</b>";
            deleteMode.disabled = false;
            drawMode.disabled = false;
            noneMode.disabled = true;
            typeSelect.disabled = true;
        }
        
        // DELETE
        if (event.keyCode == 68 & selectOn == true) /* 'd' key */ {
            var element = select.getFeatures().pop();
            fields.remove(element); 
        }
    });
    
    // Toolbar interactions
    deleteMode.onclick = function() {
        addDeleteInteraction();
    }
    
    drawMode.onclick = function() {
        addDrawInteraction();
    }
    
    noneMode.onclick = function() {
        map.removeInteraction(draw);
        drawOn = false;
        map.removeInteraction(select);
        selectOn = false;            
        text.innerHTML = "<b>NO TOOL IN USE</b>";
        deleteMode.disabled = false;
        drawMode.disabled = false;
        noneMode.disabled = true;
        typeSelect.disabled = true;
        deleteOne.disabled = true;
    }
    
    deleteOne.onclick= function() {
            var element = select.getFeatures().pop();
            fields.remove(element); 
    }
    
    // CLEAR ALL FIELDS 
    var deleteAll = document.getElementById('delete_all');
    deleteAll.onclick = function() {
        var r = confirm('Are you sure you want to clear all of your mapped fields?');
        if (r == true) {
            map.removeInteraction(draw);
            fields.clear();
            addDrawInteraction();
        }
    }
    
    // SAVE
    var save = document.getElementById('save');
    save.onclick = function() {
        var r = confirm('You can only save your fields once. Are you sure you want to save?');
        // whatever happens after saving
        if (r == true) {
            var result = fieldsLayer.getSource().getFeatures();
            var kmlFormat = new ol.format.KML();
            var string = kmlFormat.writeFeatures(result, {featureProjection: 'EPSG:3857'});
            document.getElementById('data').value = string;
            // console.log(string);
            document.getElementById('save').disabled = true;
        }
    }
    
    // Default is draw
    addDrawInteraction();
}
/*!
 * kapusons-ui-map 1.3.0
 * https://github.com/KapusonsSRL/kapusons-ui-map
 * @license MIT licensed
 *
 * Copyright (C) 2017 kapusons.it - A project by Lazymood
 */
(function(global, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function($) {
          return factory($, global, global.document, global.Math);
        });
    } else if (typeof exports === "object" && exports) {
        module.exports = factory(require('jquery'), global, global.document, global.Math);
    } else {
        factory(jQuery, global, global.document, global.Math);
    }
})(typeof window !== 'undefined' ? window : this, function($, window, document, Math, undefined) {
    'use strict';

    var ENABLED = 'kmap-enabled';

    var $window = $(window);
    var $document = $(document);

    $.fn.kapusonsUiMap = function(options) {
        //only once my friend!
        if($('html').hasClass(ENABLED)){ 
        	showError('error', 'Kapuosns-ui-map can only be initialized once and you are doing it multiple times!');
         	return; 
     	}

        // common jQuery objects
        var $htmlBody = $('html, body');
        var $body = $('body');

        var KMAP = $.fn.kapusonsUiMap;

        // Creating some defaults, extending them with any options that were provided
        options = $.extend(true, {
            dataSource: "json/world.subset.json", 
            l10n: 'en',
            mapTitle: 'Regions',
			showLeftColumn: true,
			showRegionTooltip: true,
			showRegionDescription: true,
			size: {
				width: window.innerWidth,
				height: window.innerHeight
			},
			map: {
				center: {
					lat: 38.513456, 
					lng: 44.523900
				},
				zoom: 5,
				scrollwheel: false,
				gestureHandling: 'cooperative',
		    	mapTypeControlOptions: {
			    	style: google.maps.MapTypeControlStyle.DEFAULT  
				},
				styles: [
				    {
				    	featureType: "all",
				    	elementType: "labels",
				    	stylers: [
				    		{ 
				    			visibility: "off" 
				    		}
				    	]
				    }
				]
			},
			features:{
				fillColor: "#3367D6",
				fillColorSelected: "#4285F4",
				strokeWeight: 1.5,
				strokeColor: '#96C7FC',
				fillOpacity: 1
			},
			regionOnClick: null,
			onMapLoaded: null
        }, options);

        var container = $(this);
        var psb, aMarkers = [];
        
        if(!$(this).length) {
        	showError('log', 'no dom element found');
         	return; 
        }

        prepareDom();

        var kTooltip = $('#region-tooltip');
        
        var map = new google.maps.Map($('#map-canvas').get(0), options.map);

		// Load the GeoJSON manually (works cross-origin since google sets the required HTTP headers)
		$.getJSON(options.dataSource, function (data) {
			map.data.addGeoJson(data, { idPropertyName: 'name' });
		}); 

		styleFeatures();

		map.data.addListener('addfeature', function(e) {
			if(!options.showLeftColumn) return ;

			var feature = e.feature ;
			var regName = feature.f.name;
			var regListItem = $('<li data-region="' + regName.toLowerCase() + '"></li>');
			var regTrigger = $('<a href="#" class="region-name">' + l10nRegName(regName) + '</a>');
			var regCloseTrigger = $('<a href="#" class="close-region-detail"><img src="img/x.png"></a>');
			regListItem.append(regTrigger).append(regCloseTrigger);

			regTrigger.on({
				mouseenter: function(){
					google.maps.event.trigger(map.data, 'mouseover', {
						feature: feature
					});
				},

				mouseleave: function(){
					google.maps.event.trigger(map.data, 'mouseout', {
						feature: feature
					});
				},

				click: function(ev){
					ev.preventDefault();
					ev.stopPropagation();
					var $this = $(this);
					if($this.closest('li').hasClass('active')) return false;

					google.maps.event.trigger(map.data, 'click', {
						feature: feature
					});

					setMobileMapHeight();

					setTimeout(function(){
						if(isMobile()) return;
						
						psb.update();
						$('.region-list-wrapper').get(0).scrollTop = 0;
					}, 500);
				}
			})

			$('.region-list').append(regListItem);

			regCloseTrigger.on('click', function(ev){
				ev.preventDefault();
				cleanMarkers();
				centerTo(options.map.center);
				styleFeatures();
				turnOffMapLabels();
				$('#map-region-description').empty().hide();
				$('.region-list-wrapper').removeClass('region-selected');
				$('.region-list-wrapper').append($('.region-list'));
				$('.region-list-wrapper .infowindow').remove();
				$(this).closest('li').removeClass('active').siblings().fadeIn();

				setMobileMapHeight();

				setTimeout(function(){
					if(isMobile()) return;

					psb.update();
					$('.region-list-wrapper').get(0).scrollTop = 0;
				}, 500);
			})
		});

		// Set mouseover event for each feature.
		map.data.addListener('mouseover', function(e) {
			if(isMobile()) return false;
			if(options.showRegionTooltip) {
				//console.log(e.feature.getId());
				kTooltip.attr('class', e.feature.getId());
				kTooltip.text(l10nRegName(e.feature.getId()));
				kTooltip.get(0).style.display = "inline";	
			}
			map.data.overrideStyle(e.feature, {fillColor: options.features.fillColorSelected});
		});

		// Set mouseout event for each feature.
		map.data.addListener('mouseout', function(e) {
			if(isMobile()) return false;
			if(options.showRegionTooltip) {
				kTooltip.hide();
			}
			e.feature.setProperty('fillColor', options.features.fillColor);
			map.data.revertStyle();
		});

		// trap swipe origin coordinates
		map.data.addListener('mousedown', function(e) {
			if(!e.va) return ;
			map.clickX = e.va.clientX;
			map.clickY = e.va.clientY;
		})

		map.data.addListener('click', function(e) {

			var feature = e.feature;

			// do nothing if scrolling (on mobile)
			if(e.va && (e.va.clientY > (map.clickY + 30) || e.va.clientY < (map.clickY - 30))){
				return false;
			}

			// ON REGION CLICK CUSTOM HANDLER
			if ($.isFunction( options.regionOnClick )){
				options.regionOnClick.call(e, feature);
				return ;
			}

			// ON REGION CLICK DEFAULT HANDLER

			// Select the region clicked on the left menu
			if(options.showLeftColumn) {
				var activeRegion = $('.region-list > li[data-region="' + feature.f.name.toLowerCase() + '"]');
				$('.region-list-wrapper').addClass('region-selected');
				$('.navigation-header').after($('.region-list'));
				$('.region-list > li').removeClass('active');

				// mark active region and hide all the others
				activeRegion.addClass('active');
				activeRegion.siblings().hide();
			}

			// Hide regions/polygons
			map.data.setStyle(function(feature) {
				return ({
					visible: false
				});
			});

			turnOnMapLabels();
			drawMarkers(feature, map);

		});

		// TOOLTIP POSITION
		container.mousemove(function(e) {
			if(!options.showRegionTooltip) return;

			if(options.showLeftColumn && $(e.target).closest('.region-list').length){
				kTooltip.hide();
				return;
			};

			kTooltip.css({
				top: (e.pageY - $(document).scrollTop() - (kTooltip.outerHeight()/3)),
				left: ((e.pageX + 25) >= (container.offset().left + options.size.width - kTooltip.outerWidth()) ? 
					(e.pageX - kTooltip.outerWidth() - 25) : (e.pageX + 25) )
			})
		});


		// MAP LOADED CALLBACK
		google.maps.event.addListenerOnce(map, 'idle', function(){
			if ($.isFunction( options.onMapLoaded )){
				options.onMapLoaded.call();
				return ;
			}
		});

		function l10nRegName(name){
			if(!KMAP.l10ns[options.l10n]){
				console.error('The specified l10n option (' + options.l10n + ') doesn\'t match the included l10n file (' + Object.keys($.fn.kapusonsUiMap.l10ns)[0] + '.js)');
				return;
			}
			return (KMAP.l10ns[options.l10n]['regions'] ? 
				(KMAP.l10ns[options.l10n]['regions'][name] ? 
					KMAP.l10ns[options.l10n]['regions'][name] : name ) : name )
		}

		// Mobile detection
		function isMobile(){
			var out = false;
			if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
				out = true;
			}
			return out;
		}

        /**
        * Works over the DOM structure to set it up for the current options.
        */
        function prepareDom(){

        	container.css(options.size);

			if(!options.showLeftColumn) container.addClass('full-width');

        	var domStructureString = '';

			domStructureString += (options.showLeftColumn ?

				//  LEFT COLUMN NAVIGATION
				'	<div class="col-left">' + 
				'		<div class="navigation-wrapper"> ' +
				'			<div class="navigation-header"> ' +
				'				<h2>' + options.mapTitle + '</h2> ' +
				'			</div> ' +
				'			<div class="region-list-wrapper"> ' +
				'				<ul class="region-list"></ul> ' +
				'			</div> ' +
				'		</div> ' +
				'		<a class="mobile-handler" href="#"><span class="fa fa-caret-right fa-lg"></span></a> ' +
				'		<a class="mobile-close" href="#"><img src="img/x.png" /></a>' +
				'	</div>'
				: '') +

				//  THE MAP CONTAINER
				'	<div id="map-canvas"></div>' +

				//  THE REGION TOOLTIP DISPLAYING THE HOVERED REGION NAME
					(options.showRegionTooltip ? 
				'		<div id="region-tooltip"></div>'
					: '' ) +

				//  THE REGION DETAIL ELEMENT
				(options.showRegionDescription ? 
				'		<div id="map-region-description"></div>'
					: '' );

			$(domStructureString).appendTo(container);

			if(!isMobile() && options.showLeftColumn){
				psb = new PerfectScrollbar('.region-list-wrapper', {
					wheelPropagation:true
				});
			}

			addHandlers();

            $('html').addClass(ENABLED);
        }

        function addHandlers(){

        	if(options.showLeftColumn){
        		$(document).on('click', '.region-list-wrapper .infowindow h3', function(){
					var index = $('.region-list-wrapper .infowindow').index($(this).closest('.infowindow'));
					$('.col-left').removeClass('open');
					google.maps.event.trigger(aMarkers[index], 'click');
					setMobileMapHeight();
				})

				$('.mobile-handler').on('click', function(ev){
					ev.preventDefault();
					$('.col-left').toggleClass('open');

					setMobileMapHeight();
				})

				$('.mobile-close').on('click', function(ev){
					ev.preventDefault();
					$('.close-region-detail').trigger('click');
					$('.col-left').toggleClass('open');

					setMobileMapHeight();
				})

				$('.col-left .navigation-header').on('click', function(ev){
					$('.region-list > li.active .close-region-detail').trigger('click');
				})
        	}
        	
        	if(options.showRegionDescription){
        		$(document).on('click', '.region-description-trigger', function(ev){
					ev.preventDefault();
					var url = $(this).attr('href');
					$.ajax({
						url : url,
						type : 'GET'
					}).done(function(data) {
						$('#map-region-description').show().css({opacity: 0}).html(data);

						setMobileMapHeight();

						$('#map-region-description').css({opacity: 1})

						if(isMobile()) {
							if(!$('.col-left').hasClass('open')) $('.mobile-handler').trigger('click');
							return;
						}

						if($('.map-region-description-body').height() > ($('#map-region-description').height() - $('#map-region-description > h3').height())){
							$('.map-region-description-body').css({height: ($('#map-region-description').height() - $('#map-region-description > h3').height())})

							new PerfectScrollbar('.map-region-description-body', {
								wheelPropagation: true
							});
						}
					});
				})

				$(document).on('click', '.close-region-description', function(ev){
					ev.preventDefault();
					$('#map-region-description').fadeOut(function(){
						$(this).empty();
						setMobileMapHeight();
					});
				})
        	}
        }
        
        /**
        * Set proper styles to the map features
        */
        function styleFeatures(){
			map.data.setStyle(function(feature) {
				var fillColor = feature.getProperty('selected') ? options.features.fillColorSelected : options.features.fillColor;
				return ( $.extend( options.features, {fillColor: fillColor}) );
			});
		}

		function centerMap(LatLngList, map) {
			var bounds = new google.maps.LatLngBounds();
			for (var i = 0, LtLgLen = LatLngList.length; i < LtLgLen; i++) {
				bounds.extend(LatLngList[i]);
			}
			map.setCenter(bounds.getCenter());
			map.setZoom((window.innerWidth > 600 ? 8 : 7));
			//map.fitBounds(bounds);
		}

		function drawMarkers(feat, map){
			var items   = feat.f.items; 
			if(!items) return false;
			var aLatLng = [];
			var infowindow  = new google.maps.InfoWindow();

			for (var i = 0; i < items.length; i++) {
				var lat = items[i]['lat'];
				var lng = items[i]['lng'];
				if (!lat || !lng) continue;

				var ltlg = new google.maps.LatLng(lat, lng);
				aLatLng.push(ltlg);

				var marker = new google.maps.Marker({
					"id": items[i]['id'],
					"name": items[i]['name'],
					"title": items[i]['title'],
					"address": items[i]['address'],
					"city": items[i]['city'],
					"website": items[i]['website'],
					"email": items[i]['email'],
					"phone": items[i]['phone'],
					"url": items[i]['url'],
					"position": ltlg,
					"map": map
				});

				aMarkers.push(marker);

				google.maps.event.addListener(marker, 'click', (function (m, infowindow) {
					var info = '<div class="infowindow">' +
					'<h3>' + m.name + '</h3>' +
					'	<div class="info">' + 
					(m.title ? 
						' <div class="info-title"><span>' + m.title + '</span></div>'  
						: '') + 
					(m.city ? 
						' <div><span class="label">' + KMAP.l10ns[options.l10n]['city'] + ':</span> <span>' + m.city + '</span></div>'  
						: '') +
					(m.address ? 
						' <div><span class="label">' + KMAP.l10ns[options.l10n]['address'] + ':</span> <span>' + m.address + '</span></div>' 
						: '') +
					(m.phone ? 
						' <div><span class="label">' + KMAP.l10ns[options.l10n]['phone'] + ':</span> <span>' + m.phone + '</span></div>' 
						: '') +
					(m.email ? 
						' <div><span class="label">Email:</span> <span><a href="mailto:' + m.email + '">' + m.email + '</a></span></div>' 
						: '') +
					(m.website ? 
						' <div><span class="label">' + KMAP.l10ns[options.l10n]['website'] + ':</span> <span><a href="' + m.website + '" target="_blank">' + m.website + '</a></span></div>' 
						: '') +
					(m.url ?
						' <a href="' + m.url + '" class="region-description-trigger">' + KMAP.l10ns[options.l10n]['details'] + '</a>'
						: '') +
					'   </div>' +
					'</div>';

					$('.region-list-wrapper').append(info);

					return function () {
						infowindow.close();
						infowindow.setContent(info);
						setTimeout(function(){
							infowindow.open(map, m);
						}, 300);

						setTimeout(function(){
							map.setZoom(12);
							map.setCenter(m.getPosition());
						}, 500)
					}

				})(marker, infowindow));

			}

			if(options.showRegionTooltip){
				kTooltip.hide();
			}
			
			centerMap(aLatLng, map);

		}

		function centerTo(location){
			map.setOptions({
				center: location,
				zoom: options.map.zoom,
			});
		}

		function cleanMarkers() {
			for (var i = 0; i < aMarkers.length; i++ ) {
				aMarkers[i].setMap(null);
			}
			aMarkers.length = 0;
		}

		function turnOffMapLabels(){
			map.setOptions({
				"styles": [
				{
					featureType: "all",
					elementType: "labels",
					stylers: [
						{ visibility: "off" }
					]
				}
				]
			});
		}

		function turnOnMapLabels(){
			map.setOptions({
				"styles": [
				{
					stylers: [
						{ visibility: "on" }
					]
				}
				]
			});
		}

		function setMobileMapHeight(){

			if(!isMobile()) return ;

			var h = 0;

			if($('.map-region-description-body').length){ // open detail
				h += $('.map-region-description-body').outerHeight(true);
				h += parseInt($('#map-region-description > h3').css('height').replace(/px/ig, ''));
				h += $('.navigation-wrapper').outerHeight(true);
			}else{
				if($('.col-left').hasClass('open')){
					$('.region-list-wrapper li, .region-list-wrapper > div').each(function(){
						h += $(this).outerHeight(true);
					});
					h += $('.navigation-wrapper').outerHeight(true);
				}else{
					h = '100vh';
				}
			}

			$('.map-wrapper').css({height: h});

			if($('html, body').scrollTop() > 0){
				$('html, body').animate({
					scrollTop: $('.map-wrapper').offset().top
				}, 800);
			}
		}

		KMAP.l10ns = KMAP.l10ns || {
			en: {
				"address": "address",
				"phone": "phone",
				"details": "details",
				"city": "city",
				"website": "website"
			}
		};

		/**
        * Shows a message in the console of the given type.
        */
        function showError(type, text){
            console && console[type] && console[type]('Kapusons-ui-map: ' + text);
        }

        // TODO: public functions
        // KMAP.publicMethod = publicMethod;

    };

});


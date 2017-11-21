`kapusons-ui-map` is a Kapusons implementation of interactive maps through GeoJson data. It uses [Google Maps API](https://developers.google.com/maps/). It allows you to easily render polygons of all the world's states over a google map.   

![preview](https://rawgit.com/KapusonsSRL/kapusons-ui-map/master/dist/img/europe.png)

## Features

#### Complete navigation flow
`kapusons-ui-map` consits in a mini-site with a common navigation flow: 

  - A general map, with the states you've choosen, as an index
  - A second level shows markers associated with the selected country
  - A third level goes inside the marker info and displays them

#### GeoJson data
`kapusons-ui-map` provides two GeoJson libraries with polygons coordinates for:
- Italans regions 
- All the world's states until 2015.

#### Fully configurable jQuery plugin
`kapusons-ui-map` requires jQuery as it's released as a jQuery plugin.

## Installation

#### Setup development environment

```
git clone git@github.com:KapusonsSRL/kapusons-ui-map.git
npm install
bower install
gulp serve
```

#### As a bower package

```
bower install kapusons-ui-map --save
```

#### As a npm package

```
npm install kapusons-ui-map --save
```

## Usage
You will need to include:
 - [Google maps API](https://maps.googleapis.com) with proper API key
 - [jQuery library](http://jquery.com/)
 - The JavaScript file `kapusons-ui-map.js` (or its minified version `kapusons-ui-map.min.js`)
 - The css file `kapusons-ui-map.css` (or its minified version `kapusons-ui-map.min.css`)

 Once that is done you'll only need a dom element in your html to initialize the jQuery plugin:
 ```
<div id="map-wrapper"></div>
```

and call kapusonsUiMap plugin inside a `$(document).ready` function:
```javascript
  $('#map-wrapper').kapusonsUiMap()
```
  
## Configuration
A more complex initialization with all options set could look like this:
```javascript
$('#map-wrapper').kapusonsUiMap({
  dataSource: "json/world.subset.json", 
  mapTitle: 'Regions',
  showLeftColumn: true,
  showRegionTooltip: true,
  showRegionDetail: true,
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
})
```

#### Options
- `dataSource`: defines which json will populate your map; kapusons-ui-map provides two GeoJson libraries (Italans regions and all the world's states until 2015). [See how to generate a custom GeoJson library starting from  this two](https://github.com/KapusonsSRL/kapusons-ui-map#how-to-generate-a-custom-geojson-library-as-data-source).
- `mapTitle`: a string title for your map
- `showLeftColumn`: displaying or not the left column navigation menu 
- `showRegionTooltip`: displaying or not the tooltip on state/polygon hover
- `showRegionDescription`: displaying or not the third level info of a selected state/region
- `map`: MapOptions object specification: [Google Maps JavaScript API V3 Reference](https://developers.google.com/maps/documentation/javascript/reference)
    - `center`
        - `lat`
        - `lng`
    - `zoom`
    - `scrollwheel`
    - `gestureHandling`
    - `mapTypeControlOptions`
    - `styles`
        - `featureType`
        - `elementType` 
        - `stylers`
            - `visibility`
- `features`: defines the polygon styles
    - `fillColor`
    - `fillColorSelected`
    - `strokeWeight`
    - `strokeColor`
    - `fillOpacity`
- `regionOnClick`: defines a custom handler for click event on a state/polygon; this function ovverrides the default behavior 
- `onMapLoaded`: the callback fired when the map is idle
 
## How to generate a custom GeoJson library as data source
You can easily create your GeoJson data source starting from the two GeoJson libraries provided by kapousns-ui-map. As you probably want to display a custom set of polygons/states, you'll find a usefull gulp task for this purpose. As example:

```javascript
gulp makejson --regions "it,fr,gb" --featureProperty ISO_A2 --searchIn world
```

- In the `--regions` parameter you can define a list of states/polygon you want to include in your map in the form of a comma separated string. Each value must match one of those supported standard code: **SOV_A3, ADMIN, ADM0_A3, GEOUNIT, GU_A3, SUBUNIT, SU_A3, name, NAME_LONG, BRK_A3, BRK_NAME, BRK_GROUP, ABBREV, POSTAL, FIPS_10_, ISO_A2, ISO_A3, ISO_N3, UN_A3, WB_A2, WB_A3, ADM0_A3_IS, ADM0_A3_US**
- You'll define the selected standard code in the `--featureProperty` parameter, as a comparison value
- the `--searchIn` parameter defines in which data source you'll search the specified regions (availables data source are **world** and **italy**)


## License

MIT (http://www.opensource.org/licenses/mit-license.php)

## To do list

* Improve mobile visualization
* Replace google maps infowindow component with a custom one
* Improve the configuration
* Improve the documentation

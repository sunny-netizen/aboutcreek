/*
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
*/

// ./app.js
import React, { useRef, useEffect } from "react"
import ReactDOM from "react-dom"
import './App.css';
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import creekpathdata from "./data/creekpath.geojson"
import entrancesdata from "./data/entrances.geojson"
//import bcwpathsdata from "./data/bcwpaths.geojson"
import scagdata from "./data/SCAGBikeRoutes_20231020.geojson"
import bcwdata from "./data/bcw.geojson"

// Grab the access token from your Mapbox account
// I typically like to store sensitive things like this
// in a .env file
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN

const Info = () => {
  <div className="info">
    <h1>Bike Path</h1>
    <p>The Ballona Creek Bike Path starts at Syd Kronenthal Park in east Culver City and extends about 7 miles to the Coast Bike Path along the beach. This page details its various entrances and gives suggested approaches. Click on their names for street maps. There is some free street parking near most of the entrances, except for Lincoln Blvd (11) and Marina del Rey (12).</p>
    <p>Note that the bikepath entrances are locked when there is a possibility of substantial rain. During rainstorms, the creek waters become fast and dangerous and may submerge parts of the bikepath.</p>  
  </div>
}

const Popup = ({ entrance_name, ada, description }) => (
  <div className="popup">
    <h3 className="route-name">{entrance_name}</h3>
    
    <div className="route-metric-row">
      <h4 className="row-title">Accessibility</h4>
      <div className="row-value">{ada}</div>
    </div>
    
    <p className="route-city">Serves {description}</p>
  
  </div>
)

const App = () => {
  const mapContainer = useRef()
  const popUpRef = useRef(new mapboxgl.Popup({ offset: 15 }))

  // this is where all of our map logic is going to live
  // adding the empty dependency array ensures that the map
  // is only created once
  useEffect(() => {
    // create the map and configure it
    // check out the API reference for more options
    // https://docs.mapbox.com/mapbox-gl-js/api/map/
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      //style: "mapbox://styles/mapbox/outdoors-v11",
      //style: 'mapbox://styles/mapbox/streets-v11',
      style: 'mapbox://styles/mapbox/light-v10',
      center: [-118.400833, 34.007778],
      zoom: 12,
    })

    map.on('load', function () {
      // Add the terrain layer (Terrain-RGB)
      /*map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.terrain-rgb',
        'tileSize': 512,
        'maxzoom': 14,
      });
      map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
      // Add the hillshade layer
      map.addLayer({
        'id': 'hillshader',
        'source': 'mapbox-dem',
        'type': 'hillshade',
      });
      // give the ocean depth
      map.addSource('bathymetry', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-bathymetry-v2'
      }); */
      map.addLayer(
        {
          'id': 'water-depth',
          'type': 'fill',
          'source': 'bathymetry',
          'source-layer': 'depth',
          'layout': {},
          'paint': {
            // cubic bezier is a four point curve for smooth and precise styling
            // adjust the points to change the rate and intensity of interpolation
            'fill-color': [
              'interpolate',
              ['cubic-bezier', 0, 0.5, 1, 0.5],
              ['get', 'min_depth'],
              200,
              '#78bced',
              9000,
              '#15659f'
            ]
          }
        },
        'hillshade'
      );
      map.addSource("bcw", {
        type: "geojson",
        data: bcwdata,
      }); 
      map.addLayer({
        id: "bcw-fill",
        type: "fill",
        source: "bcw",
        paint: {
          "fill-opacity": 0.2,
          "fill-color": "lightblue",
        },
      });
      map.addSource("scag", {
        type: "geojson",
        data: scagdata,
      });      
      map.addLayer({
        id: "scag-fill",
        type: "line",
        source: "scag",
        paint: {
          "line-color": 'darkgreen',//"#15cc09",
          "line-width": 0.1,
        },
      });
      map.addSource("creekpath", {
        type: "geojson",
        data: creekpathdata,
      });
      map.addLayer({
        id: "creekpath-fill",
        type: "line",
        source: "creekpath",
        paint: {
          "line-color": "#15cc09",
          "line-width": 2,
        },
      });
      map.addSource("entrances", {
        type: "geojson",
        data: entrancesdata,
      });
      map.addLayer({
        id: "entrances-fill",
        type: "circle",
        source: "entrances",
        paint: {
          "circle-color": "#ffff00",
          "circle-radius": 4,
          "circle-stroke-color": "#333333", //"#15cc09",//"
          "circle-stroke-width": 2,
        },
      });
      
      // popup
      map.on("mouseenter", 'entrances-fill', e => {

        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';

        const features = map.queryRenderedFeatures(e.point, {
          layers: ["entrances-fill"],
        })
        if (features.length > 0) {
          const feature = features[0]
          // create popup node
          const popupNode = document.createElement("div")
          ReactDOM.render(
            <Popup
              entrance_name={feature?.properties?.entrance_name}
              ada={feature?.properties?.ada}
              description={feature?.properties?.description}
            />,
            popupNode
          )
          popUpRef.current
            .setLngLat(e.lngLat)
            .setDOMContent(popupNode)
            .addTo(map)
        }
      }) //end popup

      
      
    }); 


    // cleanup function to remove map on unmount
    return () => map.remove()
  }, [])

  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />
}

export default App




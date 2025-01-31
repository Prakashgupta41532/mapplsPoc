// import { mappls, mappls_plugin } from "mappls-web-maps";
// import { useEffect, useRef, useState } from "react";

// const mapplsClassObject = new mappls();
// const mapplsPluginObject = new mappls_plugin();

// const App = () => {
//   const mapRef = useRef(null);
//   const markerRef = useRef(null);
//   const [isMapLoaded, setIsMapLoaded] = useState(false);

//   const MAP_AUTH_KEY = "30dc5b422dfc4891ecbb797004f32a6e";
//   const REVERSE_GEOCODE_URL = "https://apis.mappls.com/advancedmaps/v1";

//   const loadObject = {
//     map: true,
//     layer: "raster",
//     version: "3.0",
//     libraries: ["polydraw"],
//     plugins: ["direction", "place_picker", "search"],
//   };

//   useEffect(() => {
//     mapplsClassObject.initialize(MAP_AUTH_KEY, loadObject, () => {
//       const newMap = mapplsClassObject.Map({
//         id: "map",
//         properties: {
//           center: [28.633, 77.2194],
//           zoom: 4,
//         },
//       });

//       newMap.on("load", () => {
//         setIsMapLoaded(true);
//       });
//       newMap.on("click", async (event) => {
//         const { lng, lat } = event.lngLat;
//         const placeName = await getPlaceName(lat, lng);
        
//         if (markerRef.current) {
//           markerRef.current.remove();
//         }
//         markerRef.current = new mapplsClassObject.Marker({
//           map: newMap,
//           position: { lat, lng },
//         });
//         alert(`Place Name: ${placeName}\nCoordinates: ${lat}, ${lng}`);
//       });

//       mapRef.current = newMap;
//     });

//     return () => {
//       if (mapRef.current) {
//         mapRef.current.remove();
//       }
//     };
//   }, []);

//   const getPlaceName = async (lat, lng) => {
//     try {
//       const response = await fetch(
//         `${REVERSE_GEOCODE_URL}/${MAP_AUTH_KEY}/rev_geocode?lat=${lat}&lng=${lng}`
//       );
//       const data = await response.json();
//       console.log('================ALL_LOCATION_DETAILS', data);
//       return data.results?.[0]?.formatted_address || "Unknown Location";
//     } catch (error) {
//       console.error("Reverse Geocode Error:", error);
//       return "Failed to fetch location";
//     }
//   };

//   return (
//     <div style={{ width: "100%", height: "100vh", position: "relative" }}>
//       <div id="map" style={{ width: "100%", height: "100%" }}></div>
//     </div>
//   );
// };

// export default App;



import { mappls } from "mappls-web-maps";
import { useEffect, useRef, useState } from "react";

const mapplsClassObject = new mappls();

const App = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const MAP_AUTH_KEY = "30dc5b422dfc4891ecbb797004f32a6e";
  const REVERSE_GEOCODE_URL = "https://apis.mappls.com/advancedmaps/v1";
  const AUTO_SUGGEST_URL = `https://apis.mappls.com/advancedmaps/v1/${MAP_AUTH_KEY}/autosuggest`;

  const loadObject = {
    map: true,
    layer: "raster",
    version: "3.0",
    libraries: ["polydraw"],
    plugins: ["direction", "place_picker", "search"], // Ensure 'search' is included
  };

  useEffect(() => {
    mapplsClassObject.initialize(MAP_AUTH_KEY, loadObject, () => {
      const newMap = mapplsClassObject.Map({
        id: "map",
        properties: {
          center: [28.633, 77.2194],
          zoom: 4,
        },
      });

      newMap.on("load", () => {
        setIsMapLoaded(true);
      });

      newMap.on("click", async (event) => {
        const { lng, lat } = event.lngLat;
        const placeName = await getPlaceName(lat, lng);

        if (markerRef.current) {
          markerRef.current.remove();
        }

        markerRef.current = new mapplsClassObject.Marker({
          map: newMap,
          position: { lat, lng },
        });

        alert(`Place Name: ${placeName}\nCoordinates: ${lat}, ${lng}`);
      });

      mapRef.current = newMap;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  const getPlaceName = async (lat, lng) => {
    try {
      const response = await fetch(
        `${REVERSE_GEOCODE_URL}/${MAP_AUTH_KEY}/rev_geocode?lat=${lat}&lng=${lng}`
      );
      const data = await response.json();
      return data.results?.[0]?.formatted_address || "Unknown Location";
    } catch (error) {
      console.error("Reverse Geocode Error:", error);
      return "Failed to fetch location";
    }
  };

  const handleSearch = async (query) => {
    if (!query) return;
  
    try {
      const response = await fetch(`${AUTO_SUGGEST_URL}?query=${query}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Auto Suggest Response:", data);
  
      if (data.suggestedLocations) {
        setSuggestions(data.suggestedLocations);
      } else {
        console.warn("No suggestions found:", data);
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Search Error:", error);
    }
  };
  

  const handleSelectLocation = (location) => {
    setSearchQuery(location.placeName);
    setSuggestions([]);

    const { latitude, longitude } = location;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    markerRef.current = new mapplsClassObject.Marker({
      map: mapRef.current,
      position: { lat: latitude, lng: longitude },
    });

    mapRef.current.setCenter([longitude, latitude]);
    mapRef.current.setZoom(14);
  };

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {/* Search Box */}
      <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "white", padding: "10px", borderRadius: "5px", width: "300px" }}>
        <input
          type="text"
          placeholder="Search for a place..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: "100%", padding: "8px", fontSize: "14px", border: "1px solid #ccc", borderRadius: "5px" }}
        />
        {suggestions.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, border: "1px solid #ccc", background: "white", position: "absolute", width: "100%", zIndex: 1000 }}>
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSelectLocation(suggestion)}
                style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #ddd" }}
              >
                {suggestion.placeName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map Container */}
      <div id="map" style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
};

export default App;

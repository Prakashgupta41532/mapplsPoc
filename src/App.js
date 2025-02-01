import axios from "axios";
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
  const AUTO_SUGGEST_URL = `https://atlas.mappls.com/api/places/search/autosuggest`;
  const ACCESS_TOKEN = "e2ab577f-1711-415b-8264-5ed4c59e0e9f";

  const loadObject = {
    map: true,
    layer: "raster",
    version: "3.0",
    libraries: ["polydraw"],
    plugins: ["direction", "place_picker", "search"],
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


  const getCoordinatesFromEloc = async (eLoc) => {
    try {
      const response = await axios.get(`https://explore.mappls.com/apis/O2O/entity/${eLoc}`, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
  
      const data = response.data;
      console.log("Place Details Response:", data);
  
      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
      };
    } catch (error) {
      console.error("Error fetching coordinates from eLoc:", error);
      return null;
    }
  };
  
  
  
  const handleSelectLocation = async (location) => {
    console.log("Selected Location:", location);
  
    if (!location || !location.eLoc) {
      console.error("Invalid location data:", location);
      return;
    }
  
    setSearchQuery(location.placeName);
    setSuggestions([]);
  
    const coords = await getCoordinatesFromEloc(location.eLoc);
    if (!coords) {
      console.error("Failed to retrieve coordinates.");
      return;
    }
  
    const { latitude, longitude } = coords;
  
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
  
  const getPlaceName = async (lat, lng) => {
    try {
      const response = await fetch(
        `${REVERSE_GEOCODE_URL}/${MAP_AUTH_KEY}/rev_geocode?lat=${lat}&lng=${lng}`
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (!data || !data.results || data.results.length === 0) {
        throw new Error("No results found");
      }
  
      return data.results[0]?.formatted_address || "Unknown Location";
    } catch (error) {
      console.error("Reverse Geocode Error:", error);
      return "Failed to fetch location";
    }
  };
  

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const AUTO_SEARCH_URL = (query) => `http://localhost:3001/search?q=${query}`;
    try {
      const response = await axios.get(AUTO_SEARCH_URL(query), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = response.data;
      console.log("Auto Suggest Response:", data);

      if (data.suggestedLocations && data.suggestedLocations.length > 0) {
        setSuggestions(data.suggestedLocations);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Search Error:", error);
      setSuggestions([]);
    }
  };

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {/* Search Box */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "white",
          padding: "10px",
          borderRadius: "5px",
          width: "300px",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <input
          type="text"
          placeholder="Search for a place..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
        {suggestions.length > 0 && (
          <div
            style={{
              marginTop: "5px",
              border: "1px solid #ccc",
              background: "white",
              borderRadius: "5px",
              maxHeight: "200px",
              overflowY: "auto",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <ul
              style={{
                listStyle: "none",
                padding: "0",
                margin: "0",
              }}
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSelectLocation(suggestion)}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #ddd",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "#f1f1f1")}
                  onMouseLeave={(e) => (e.target.style.background = "white")}
                >
                  {suggestion.placeName}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Map */}
      <div id="map" style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
};

export default App;

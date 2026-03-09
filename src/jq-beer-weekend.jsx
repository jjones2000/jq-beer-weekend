import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Shirt, Share2, Navigation, Check, X, Beer, Route as RouteIcon, Info, Loader } from 'lucide-react';

// Fix for default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Venue data
const VENUES = [
  { id: 1, name: "Temper & Brown", address: "12-13 Albion Street, B1 3ED", lat: 52.4869, lng: -1.9009, isTshirtVenue: true },
  { id: 2, name: "The Rolling Mill", address: "25 Hall Street, B18 6BS", lat: 52.4891, lng: -1.9125, isTshirtVenue: true },
  { id: 3, name: "The Wolf", address: "2-10 Constitution Hill, B19 3LY", lat: 52.4926, lng: -1.9133, isTshirtVenue: true },
  { id: 4, name: "The Barrel Store", address: "Arch 32, Water Street, B3 1HL", lat: 52.4823, lng: -1.9085, isTshirtVenue: true },
  { id: 5, name: "Indian Brewery Taproom", address: "1 Mary Ann Street, B3 1RL", lat: 52.4831, lng: -1.9016, isTshirtVenue: true },
  { id: 6, name: "The Rectory", address: "50-54 St. Paul's Square, B3 1QS", lat: 52.4831, lng: -1.8997, isTshirtVenue: true },
  { id: 7, name: "1000 Trades JQ", address: "16 Frederick Street, B1 3HE", lat: 52.4867, lng: -1.9028, isTshirtVenue: false },
  { id: 8, name: "The Button Factory", address: "25 Frederick Street, B1 3HE", lat: 52.4869, lng: -1.9025, isTshirtVenue: false },
  { id: 9, name: "The Bug and Barrel", address: "60 Vittoria Street, B1 3PB", lat: 52.4855, lng: -1.9035, isTshirtVenue: false, offer: "Beers on tap are 2-4-1. Buy 2 get 1 free on everything else." },
  { id: 10, name: "JQ Bar & Grill", address: "166 Warstone Lane, B18 6NN", lat: 52.4888, lng: -1.9089, isTshirtVenue: false },
  { id: 11, name: "Rose Villa Tavern", address: "172 Warstone Lane, B18 6JW", lat: 52.4889, lng: -1.9095, isTshirtVenue: false },
  { id: 12, name: "The Jewellers Arms", address: "23 Hockley Street, B18 6BW", lat: 52.4882, lng: -1.9077, isTshirtVenue: false },
  { id: 13, name: "Rock & Roll BrewHouse", address: "19 Hall Street, B18 6BS", lat: 52.4890, lng: -1.9120, isTshirtVenue: false },
  { id: 14, name: "The Lord Clifden", address: "34 Great Hampton St, B18 6AA", lat: 52.4912, lng: -1.9110, isTshirtVenue: false },
  { id: 15, name: "The Church", address: "22 Great Hampton Street, B18 6AQ", lat: 52.4910, lng: -1.9107, isTshirtVenue: false, offer: "Enjoy a £5 Scotch Egg when you show your sticker book." },
  { id: 16, name: "Burning Soul Brewery", address: "Unit 51, Mott Street, B19 3HE", lat: 52.4935, lng: -1.9140, isTshirtVenue: false },
  { id: 17, name: "Hen & Chickens", address: "27 Constitution Hill, B19 3LE", lat: 52.4924, lng: -1.9128, isTshirtVenue: false },
  { id: 18, name: "Indian Brewery Snowhill", address: "Arch 15-16, Livery Street, B3 1EU", lat: 52.4815, lng: -1.9037, isTshirtVenue: false },
  { id: 19, name: "Arch 13 at Connolly's", address: "220 Livery Street, B3 1EU", lat: 52.4818, lng: -1.9040, isTshirtVenue: false },
  { id: 20, name: "Actress & Bishop", address: "36 Ludgate Hill, B3 1EH", lat: 52.4820, lng: -1.9015, isTshirtVenue: false },
  { id: 21, name: "Samai Thai", address: "30 Mary Ann Street, B3 1RL", lat: 52.4830, lng: -1.9018, isTshirtVenue: false },
  { id: 22, name: "Saint Paul's Market", address: "4 Mary Ann Street, B3 1RL", lat: 52.4829, lng: -1.9012, isTshirtVenue: false },
  { id: 23, name: "Saint Pauls House", address: "15-20 St. Paul's Square, B3 1QU", lat: 52.4832, lng: -1.8995, isTshirtVenue: false },
  { id: 24, name: "The Jam House", address: "3-5 St. Paul's Square, B3 1QU", lat: 52.4830, lng: -1.8993, isTshirtVenue: false },
  { id: 25, name: "The Queens Arms", address: "150 Newhall Street, B3 1RY", lat: 52.4810, lng: -1.8980, isTshirtVenue: false },
  { id: 26, name: "The Shakespeare", address: "31 Summer Row, B3 1JJ", lat: 52.4802, lng: -1.9005, isTshirtVenue: false, offer: "20% off your round when you show your sticker book." },
];

// Component to fit map bounds to walking route
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
};

// Nearest-neighbour TSP: reorder venues so the total walking distance is minimised.
// Starts from the first venue the user added (preserves their "start point").
const optimiseRouteOrder = (venues) => {
  if (venues.length <= 2) return venues;

  const haversine = (a, b) => {
    const R = 6371000;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  };

  const remaining = [...venues.slice(1)];
  const ordered = [venues[0]];

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let nearestDist = haversine(last, remaining[0]);
    for (let i = 1; i < remaining.length; i++) {
      const d = haversine(last, remaining[i]);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return ordered;
};

const JQBeerWeekend = () => {
  const [selectedVenues, setSelectedVenues] = useState([]);
  const [visitedVenues, setVisitedVenues] = useState([]);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [walkingRoute, setWalkingRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  const mapCenter = [52.4872, -1.9065];

  useEffect(() => {
    const loadVisited = async () => {
      try {
        if (window.storage) {
          const result = await window.storage.get('visited-venues');
          if (result && result.value) {
            setVisitedVenues(JSON.parse(result.value));
          }
        }
      } catch (error) {
        console.log('No visited venues yet');
      }
    };
    loadVisited();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const route = params.get('route');
    if (route) {
      try {
        const venueIds = route.split(',').map(Number);
        const venues = VENUES.filter(v => venueIds.includes(v.id));
        setSelectedVenues(venues);
        setShowRoutePanel(true);
      } catch (error) {
        console.error('Invalid route');
      }
    }
  }, []);

  // Fetch actual walking route from OSRM whenever selected venues change
  useEffect(() => {
    const fetchWalkingRoute = async () => {
      if (selectedVenues.length < 2) {
        setWalkingRoute(null);
        setRouteInfo(null);
        return;
      }

      setRouteLoading(true);
      try {
        // Optimise stop order with nearest-neighbour before routing
        const orderedVenues = optimiseRouteOrder(selectedVenues);
        // Build OSRM waypoints string: lng,lat;lng,lat;...
        const waypoints = orderedVenues
          .map(v => `${v.lng},${v.lat}`)
          .join(';');

        // router.project-osrm.org only supports driving — use the OSM Germany
        // instance which has the actual foot profile for real walking distances/times
        const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${waypoints}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes.length > 0) {
          const route = data.routes[0];
          // GeoJSON coords are [lng, lat], Leaflet needs [lat, lng]
          const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setWalkingRoute(coords);

          const distanceKm = (route.distance / 1000).toFixed(1);
          const durationMins = Math.round(route.duration / 60);
          setRouteInfo({ distance: distanceKm, duration: durationMins });
        }
      } catch (err) {
        console.error('Failed to fetch walking route:', err);
        // Fall back to straight lines in optimised order
        const orderedVenues = optimiseRouteOrder(selectedVenues);
        setWalkingRoute(orderedVenues.map(v => [v.lat, v.lng]));
        setRouteInfo(null);
      } finally {
        setRouteLoading(false);
      }
    };

    fetchWalkingRoute();
  }, [selectedVenues]);

  const toggleVenue = (venue) => {
    setSelectedVenues(prev => {
      const exists = prev.find(v => v.id === venue.id);
      if (exists) return prev.filter(v => v.id !== venue.id);
      return [...prev, venue];
    });
  };

  const toggleVisited = async (venueId) => {
    const newVisited = visitedVenues.includes(venueId)
      ? visitedVenues.filter(id => id !== venueId)
      : [...visitedVenues, venueId];
    setVisitedVenues(newVisited);
    try {
      if (window.storage) {
        await window.storage.set('visited-venues', JSON.stringify(newVisited));
      }
    } catch (error) {
      console.error('Error saving visited venues:', error);
    }
  };

  const shareRoute = () => {
    const venueIds = selectedVenues.map(v => v.id).join(',');
    const url = `${window.location.origin}${window.location.pathname}?route=${venueIds}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url);
  };

  const clearRoute = () => {
    setSelectedVenues([]);
    setShareUrl('');
    setWalkingRoute(null);
    setRouteInfo(null);
  };

  const clearVisited = async () => {
    setVisitedVenues([]);
    try {
      if (window.storage) {
        await window.storage.delete('visited-venues');
      }
    } catch (error) {
      console.error('Error clearing visited venues:', error);
    }
  };

  const resetAll = () => {
    setSelectedVenues([]);
    setShareUrl('');
    setWalkingRoute(null);
    setRouteInfo(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  const stickersCollected = visitedVenues.length;
  const canGetTshirt = stickersCollected >= 6;

  // Custom map markers — green when visited, amber for t-shirt, orange if in route, blue otherwise
  const createCustomIcon = (venue, isVisited, isSelected, routeIndex) => {
    let bgColor, borderColor, content;

    if (isVisited) {
      bgColor = '#22c55e';   // green-500
      borderColor = '#16a34a';
      content = '<span style="color:white;font-size:10px;font-weight:bold;line-height:1">✓</span>';
    } else if (venue.isTshirtVenue) {
      bgColor = '#8b5cf6';   // violet-500
      borderColor = '#7c3aed';
      content = '<span style="font-size:9px;line-height:1">👕</span>';
    } else if (isSelected) {
      bgColor = '#f97316';   // orange-500
      borderColor = '#ea580c';
      content = '';
    } else {
      bgColor = '#3b82f6';   // blue-500
      borderColor = '#2563eb';
      content = '';
    }

    const badge = routeIndex >= 0
      ? `<div style="position:absolute;top:-8px;right:-8px;background:#c2410c;color:white;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:bold;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)">${routeIndex + 1}</div>`
      : '';

    const html = `
      <div style="position:relative;width:22px;height:22px;border-radius:50%;background:${bgColor};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;outline:2px solid ${borderColor};transition:all 0.2s">
        ${content}
        ${badge}
      </div>
    `;

    return L.divIcon({
      html,
      className: 'bg-transparent border-none',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -14],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-800 to-amber-900 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Beer className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">JQ Beer Weekend 2026</h1>
                <p className="text-amber-100">16th–18th April • Jewellery Quarter, Birmingham</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stickersCollected}/6</div>
              <div className="text-sm text-amber-100">Stickers Collected</div>
              {canGetTshirt && (
                <div className="mt-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  T-Shirt Unlocked! 🎉
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-6 mt-4 rounded-r-lg shadow max-w-7xl lg:mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-bold mb-1">How it works:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Visit participating venues and get a sticker with each drink</li>
                  <li>Collect 6 stickers to earn a FREE exclusive t-shirt</li>
                  <li>Redeem your t-shirt at any venue with a <Shirt className="w-3 h-3 inline" /> icon</li>
                  <li>Tick venues off as you visit them — markers turn green on the map!</li>
                  <li>Add venues to your route to get a real walking path between them</li>
                </ul>
              </div>
            </div>
            <button onClick={() => setShowInfo(false)} className="text-blue-600 hover:text-blue-800">
              <X className="w-5 h-5" /> Close help
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">

          {/* Map Section */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-amber-200">
              <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-2xl font-bold text-gray-800">Interactive Map</h2>
                <div className="flex gap-2 flex-wrap">
                  {routeLoading && (
                    <div className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm">
                      <Loader className="w-4 h-4 animate-spin" />
                      Calculating route…
                    </div>
                  )}
                  {routeInfo && !routeLoading && (
                    <div className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                      🚶 {routeInfo.distance} km · ~{routeInfo.duration} min walk
                    </div>
                  )}
                  <button
                    onClick={resetAll}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={() => setShowRoutePanel(!showRoutePanel)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
                  >
                    <RouteIcon className="w-4 h-4" />
                    My Route ({selectedVenues.length})
                  </button>
                </div>
              </div>

              {/* Leaflet Map */}
              <div className="relative h-[600px] rounded-xl overflow-hidden border-2 border-gray-200 z-0">
                <MapContainer
                  center={mapCenter}
                  zoom={15}
                  style={{ height: '600px', width: '100%' }}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Real walking route polyline */}
                  {walkingRoute && walkingRoute.length > 1 && (
                    <>
                      {/* Shadow/halo for contrast */}
                      <Polyline
                        positions={walkingRoute}
                        color="#fff"
                        weight={7}
                        opacity={0.6}
                      />
                      <Polyline
                        positions={walkingRoute}
                        color="#f97316"
                        weight={4}
                        opacity={0.9}
                      />
                    </>
                  )}

                  {/* Fit map to walking route */}
                  {walkingRoute && walkingRoute.length > 1 && (
                    <FitBounds positions={walkingRoute} />
                  )}

                  {/* All venue markers */}
                  {VENUES.map((venue) => {
                    const isVisited = visitedVenues.includes(venue.id);
                    const isSelected = !!selectedVenues.find(v => v.id === venue.id);
                    const routeIndex = selectedVenues.findIndex(v => v.id === venue.id);

                    return (
                      <Marker
                        key={venue.id}
                        position={[venue.lat, venue.lng]}
                        icon={createCustomIcon(venue, isVisited, isSelected, routeIndex)}
                      >
                        <Popup className="rounded-lg shadow-lg">
                          <div className="p-1 min-w-[190px]">
                            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1 mb-0.5">
                              {venue.name}
                              {venue.isTshirtVenue && <Shirt className="w-4 h-4 text-violet-600 flex-shrink-0" />}
                            </h3>
                            <p className="text-xs text-gray-500 mb-3">{venue.address}</p>

                            {venue.offer && (
                              <p className="text-xs text-blue-600 font-medium mb-3 bg-blue-50 p-2 rounded">
                                🎁 {venue.offer}
                              </p>
                            )}

                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => toggleVisited(venue.id)}
                                className={`w-full py-2 px-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition ${
                                  isVisited
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <Check className="w-4 h-4" />
                                {isVisited ? '✓ Visited' : 'Mark as Visited'}
                              </button>
                              <button
                                onClick={() => toggleVenue(venue)}
                                className={`w-full py-2 px-2 rounded text-xs font-bold flex items-center justify-center gap-1 transition ${
                                  isSelected
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-orange-600 text-white hover:bg-orange-700'
                                }`}
                              >
                                {isSelected ? (
                                  <><X className="w-4 h-4" /> Remove from Route</>
                                ) : (
                                  <><MapPin className="w-4 h-4" /> Add to Route</>
                                )}
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>

                {/* Map Legend */}
                <div className="absolute bottom-4 z-[1000] pointer-events-none" style={{display:'flex', flexDirection:'row', gap:'6px', alignItems:'center', left:'50%'}}>
                  {[
                    { color: '#8b5cf6', label: 'T-Shirt' },
                    { color: '#3b82f6', label: 'Venue' },
                    { color: '#22c55e', label: 'Visited' },
                    { color: '#f97316', label: 'In route' },
                  ].map(({ color, label }) => (
                    <div key={label} style={{display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.88)', borderRadius:'20px', padding:'3px 8px 3px 5px', backdropFilter:'blur(4px)', boxShadow:'0 1px 3px rgba(0,0,0,0.15)'}}>
                      <div style={{width:'10px', height:'10px', borderRadius:'50%', background:color, flexShrink:0}} />
                      <span style={{fontSize:'11px', fontWeight:'500', color:'#374151', whiteSpace:'nowrap'}}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Route Panel */}
          <div className="max-w-7xl mx-auto px-0 mt-6">
            {showRoutePanel && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-orange-600" />
                    Your Route
                  </h3>
                  <button onClick={() => setShowRoutePanel(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {routeInfo && (
                  <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-2.5 text-sm text-green-800 font-medium flex items-center gap-2">
                    🚶 {routeInfo.distance} km · ~{routeInfo.duration} min walk
                  </div>
                )}

                {selectedVenues.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
                    Click venues on the map to add them to your route
                  </p>
                ) : (
                  <>
                    <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:"0.5rem", maxHeight:"320px", overflowY:"auto", marginBottom:"1rem"}}>
                      {selectedVenues.map((venue, idx) => (
                        <div
                          key={venue.id}
                          className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg border border-orange-100"
                        >
                          <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-800 flex items-center gap-1">
                              {venue.name}
                              {venue.isTshirtVenue && <Shirt className="w-3 h-3 text-violet-600" />}
                            </div>
                            <div className="text-xs text-gray-500">{venue.address}</div>
                          </div>
                          <button
                            onClick={() => toggleVenue(venue)}
                            className="text-red-400 hover:text-red-600 flex-shrink-0 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={shareRoute}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 font-medium"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Route Link
                      </button>
                      {shareUrl && (
                        <div className="text-xs text-green-600 text-center font-medium bg-green-50 p-2 rounded">
                          Link copied to clipboard! ✓
                        </div>
                      )}
                      <button
                        onClick={clearRoute}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium"
                      >
                        Clear Route
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
      </div>

      {/* Full-width Venue List */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-200">

          <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">All Venues</h3>
              <p className="text-sm text-gray-500 mt-1">{VENUES.length} venues across the Jewellery Quarter</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-sm font-semibold text-blue-800">
                {visitedVenues.length} / {VENUES.length} visited
              </div>
              {visitedVenues.length >= 6 && (
                <div className="bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                  🎉 T-Shirt Unlocked!
                </div>
              )}
              <button
                onClick={clearVisited}
                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition border border-red-100"
              >
                Reset Visit History
              </button>
            </div>
          </div>

          {/* T-shirt venues */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-violet-100" />
              <div className="text-sm font-bold text-violet-700 flex items-center gap-2 bg-violet-50 px-4 py-1.5 rounded-full border border-violet-200 whitespace-nowrap">
                <Shirt className="w-4 h-4" />
                T-Shirt Collection Points
              </div>
              <div className="h-px flex-1 bg-violet-100" />
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:"1rem"}}>
              {VENUES.filter(v => v.isTshirtVenue).map(venue => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  isVisited={visitedVenues.includes(venue.id)}
                  isSelected={!!selectedVenues.find(v => v.id === venue.id)}
                  onToggleVisit={toggleVisited}
                  onToggleRoute={toggleVenue}
                />
              ))}
            </div>
          </div>

          {/* Other venues */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-blue-100" />
              <div className="text-sm font-bold text-blue-700 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200 whitespace-nowrap">
                Participating Venues
              </div>
              <div className="h-px flex-1 bg-blue-100" />
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:"1rem"}}>
              {VENUES.filter(v => !v.isTshirtVenue).map(venue => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  isVisited={visitedVenues.includes(venue.id)}
                  isSelected={!!selectedVenues.find(v => v.id === venue.id)}
                  onToggleVisit={toggleVisited}
                  onToggleRoute={toggleVenue}
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-300 p-8 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <Beer className="w-8 h-8 mx-auto mb-4 text-amber-600 opacity-50" />
          <p className="font-bold text-white mb-2">JQ Beer Weekend 2026 • 16th–18th April</p>
          <p className="text-sm max-w-md mx-auto mb-4">
            Visit 6 participating venues to collect your FREE exclusive t-shirt! Remember to drink responsibly.
          </p>
          <a
            href="https://www.thejewelleryquarter.org/beer-weekend/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:text-amber-400 font-medium transition-colors inline-flex items-center gap-1"
          >
            Official Website <Navigation className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

// Venue card for the full-width grid below the map
const VenueCard = ({ venue, isVisited, isSelected, onToggleVisit, onToggleRoute }) => {
  return (
    <div
      className={`rounded-xl p-4 transition-all duration-200 flex flex-col gap-3 h-full ${isVisited ? 'bg-green-50' : isSelected ? 'bg-orange-50' : 'bg-white'}`}
      style={{
        border: isVisited ? '2px solid #4ade80' : isSelected ? '2px solid #fb923c' : '2px solid #d1d5db',
        boxShadow: isVisited ? '0 1px 4px rgba(74,222,128,0.2)' : isSelected ? '0 1px 4px rgba(251,146,60,0.2)' : '0 1px 3px rgba(0,0,0,0.07)'
      }}
    >

      {/* Name + icon */}
      <div className="flex-1">
        <div className={`font-bold text-sm leading-snug mb-1 flex items-start gap-1.5 ${isVisited ? 'text-green-800' : 'text-gray-900'}`}>
          {isVisited && <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />}
          <span>{venue.name}</span>
          {venue.isTshirtVenue && (
            <span title="T-Shirt Venue" className="bg-violet-100 p-0.5 rounded-full flex-shrink-0 ml-auto">
              <Shirt className="w-3 h-3 text-violet-600" />
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 leading-tight">{venue.address}</div>

        {venue.offer && (
          <div className="mt-2 text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100 leading-snug">
            🎁 {venue.offer}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onToggleVisit(venue.id)}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
            isVisited
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          {isVisited ? 'Visited' : 'Visit'}
        </button>
        <button
          onClick={() => onToggleRoute(venue)}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
            isSelected
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          {isSelected ? 'Remove' : 'Route'}
        </button>
      </div>
    </div>
  );
};

export default JQBeerWeekend;
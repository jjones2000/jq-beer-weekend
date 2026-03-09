import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Shirt, Share2, Navigation, Check, X, Beer, Route as RouteIcon, Info } from 'lucide-react';

// Fix for default Leaflet icon paths (standard fallback)
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

const JQBeerWeekend = () => {
  const [selectedVenues, setSelectedVenues] = useState([]);
  const [visitedVenues, setVisitedVenues] = useState([]);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [shareUrl, setShareUrl] = useState('');

  // Map settings
  const mapCenter = [52.4869, -1.9050];

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

  const toggleVenue = (venue) => {
    setSelectedVenues(prev => {
      const exists = prev.find(v => v.id === venue.id);
      if (exists) {
        return prev.filter(v => v.id !== venue.id);
      } else {
        return [...prev, venue];
      }
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
    window.history.pushState({}, '', window.location.pathname);
  };

  const stickersCollected = visitedVenues.length;
  const canGetTshirt = stickersCollected >= 6;

  // Function to create beautiful custom HTML markers that match your SVG styling
  const createCustomIcon = (venue, isVisited, isSelected, routeIndex) => {
    let bgColor = 'bg-blue-500';
    let content = '';

    if (isVisited) {
      bgColor = 'bg-green-500';
      content = '<span class="text-white text-[10px] font-bold">✓</span>';
    } else if (venue.isTshirtVenue) {
      bgColor = 'bg-amber-500';
      content = '<span class="text-white text-[10px]">👕</span>';
    } else if (isSelected) {
      bgColor = 'bg-orange-500';
    }

    let badge = '';
    if (routeIndex >= 0) {
      badge = `<div class="absolute -top-2 -right-2 bg-orange-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-white">${routeIndex + 1}</div>`;
    }

    const html = `
      <div class="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-white shadow-md ${bgColor} transition-all duration-300">
        ${content}
        ${badge}
      </div>
    `;

    return L.divIcon({
      html,
      className: 'bg-transparent border-none',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -12] // Pop up slightly above the marker
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
                <p className="text-amber-100">16th-18th April • Jewellery Quarter, Birmingham</p>
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
                  <li>Click venues on the map to plan your route, check them off as you visit!</li>
                </ul>
              </div>
            </div>
            <button onClick={() => setShowInfo(false)} className="text-blue-600 hover:text-blue-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-amber-200">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Interactive Map</h2>
                <div className="flex gap-2">
                  <button
                    onClick={resetAll}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                    title="Reset map and route"
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

              {/* LIVE LEAFLET MAP */}
              <div className="relative h-[600px] rounded-xl overflow-hidden border-2 border-gray-200 z-0">
                <MapContainer 
                    center={mapCenter} 
                    zoom={16} 
                    style={{ height: '600px', width: '100%' }} // Add this inline style
                    className="h-full w-full"
                  >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Route lines */}
                  {selectedVenues.length > 1 && (
                    <Polyline 
                      positions={selectedVenues.map(v => [v.lat, v.lng])}
                      color="#f97316"
                      weight={3}
                      dashArray="5, 8"
                    />
                  )}

                  {/* Venue markers */}
                  {VENUES.map((venue) => {
                    const isVisited = visitedVenues.includes(venue.id);
                    const isSelected = selectedVenues.find(v => v.id === venue.id);
                    const routeIndex = selectedVenues.findIndex(v => v.id === venue.id);

                    return (
                      <Marker 
                        key={venue.id} 
                        position={[venue.lat, venue.lng]}
                        icon={createCustomIcon(venue, isVisited, isSelected, routeIndex)}
                      >
                        <Popup className="rounded-lg shadow-lg">
                          <div className="p-1 min-w-[180px]">
                            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1">
                              {venue.name}
                              {venue.isTshirtVenue && <Shirt className="w-4 h-4 text-amber-600" />}
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
                                {isVisited ? 'Visited' : 'Mark as Visited'}
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

                {/* Map Legend (Overlay) */}
                <div className="absolute bottom-6 left-4 z-[1000] bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 border-2 border-gray-200 pointer-events-none">
                  <div className="text-xs font-bold mb-2 text-gray-700">Legend</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center"><span className="text-[8px] text-white">👕</span></div>
                      <span>T-Shirt Venue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                      <span>Participating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white text-[8px] font-bold">✓</div>
                      <span>Visited</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
                      <span>In Route</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Route Panel */}
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

                {selectedVenues.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
                    Click venues on the map to add them to your route
                  </p>
                ) : (
                  <>
                    <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
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
                              {venue.isTshirtVenue && <Shirt className="w-3 h-3 text-amber-600" />}
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

            {/* Venue List */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-blue-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">All Venues</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                  {VENUES.length}
                </span>
              </div>
              
              <div className="mb-4">
                <button
                  onClick={clearVisited}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition border border-red-100"
                >
                  Reset Visit History
                </button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {/* T-shirt venues first */}
                <div className="mb-6">
                  <div className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2 bg-amber-50 p-2 rounded-lg">
                    <Shirt className="w-4 h-4" />
                    T-Shirt Collection Points
                  </div>
                  {VENUES.filter(v => v.isTshirtVenue).map(venue => (
                    <VenueItem
                      key={venue.id}
                      venue={venue}
                      isVisited={visitedVenues.includes(venue.id)}
                      isSelected={selectedVenues.find(v => v.id === venue.id)}
                      onToggleVisit={toggleVisited}
                      onToggleRoute={toggleVenue}
                    />
                  ))}
                </div>

                {/* Other venues */}
                <div>
                  <div className="text-sm font-bold text-blue-700 mb-3 bg-blue-50 p-2 rounded-lg">
                    Participating Venues
                  </div>
                  {VENUES.filter(v => !v.isTshirtVenue).map(venue => (
                    <VenueItem
                      key={venue.id}
                      venue={venue}
                      isVisited={visitedVenues.includes(venue.id)}
                      isSelected={selectedVenues.find(v => v.id === venue.id)}
                      onToggleVisit={toggleVisited}
                      onToggleRoute={toggleVenue}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-300 p-8 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <Beer className="w-8 h-8 mx-auto mb-4 text-amber-600 opacity-50" />
          <p className="font-bold text-white mb-2">JQ Beer Weekend 2026 • 16th-18th April</p>
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

// Extracted Component for the Sidebar List Items
const VenueItem = ({ venue, isVisited, isSelected, onToggleVisit, onToggleRoute }) => {
  return (
    <div className={`p-3 rounded-xl border-2 mb-2 transition-all duration-200 ${
      isVisited ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
            {venue.name}
            {venue.isTshirtVenue && (
              <span title="T-Shirt Venue" className="bg-amber-100 p-1 rounded-full"><Shirt className="w-3 h-3 text-amber-600" /></span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 line-clamp-1">{venue.address}</div>
          {venue.offer && (
            <div className="text-[11px] text-blue-700 mt-2 font-medium bg-blue-50 p-1.5 rounded border border-blue-100 inline-block">
              🎁 {venue.offer}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => onToggleVisit(venue.id)}
            className={`p-2 rounded-lg transition-colors shadow-sm ${
              isVisited
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            title={isVisited ? 'Mark as not visited' : 'Mark as visited'}
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleRoute(venue)}
            className={`p-2 rounded-lg transition-colors shadow-sm ${
              isSelected
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600'
            }`}
            title={isSelected ? 'Remove from route' : 'Add to route'}
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JQBeerWeekend;
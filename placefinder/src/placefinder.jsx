import React, { useState } from 'react';
import axios from 'axios';
import './styles.css';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '400px'
};

const defaultCenter = {
    lat: 14.5995,
    lng: 120.9842
};

const categories = [
    { key: 'food', label: 'Food and Drink', icon: 'https://maps.google.com/mapfiles/kml/shapes/dining.png' },
    { key: 'shopping', label: 'Shopping', icon: 'https://maps.google.com/mapfiles/kml/shapes/shopping.png' },
    { key: 'entertainment', label: 'Entertainment', icon: 'https://maps.google.com/mapfiles/kml/shapes/arts.png' },
    { key: 'community', label: 'Community', icon: 'https://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png' }
];

const PlaceIdFinder = () => {
    const [pincode, setPincode] = useState('');
    const [inputType, setInputType] = useState('line');
    const [inputs, setInputs] = useState({
        food: '',
        shopping: '',
        entertainment: '',
        community: ''
    });
    const [results, setResults] = useState({
        food: [],
        shopping: [],
        entertainment: [],
        community: []
    });

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
    });

    const handleInputChange = (categoryKey, value) => {
        setInputs(prev => ({ ...prev, [categoryKey]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const newResults = { food: [], shopping: [], entertainment: [], community: [] };

        for (const { key, label } of categories) {
            const rawInput = inputs[key];
            const placesArray = inputType === 'comma'
                ? rawInput.split(',').map(p => p.trim())
                : rawInput.split('\n').map(p => p.trim());

            const filteredPlaces = placesArray.filter(place => place.length > 0);

            for (const place of filteredPlaces) {
                const input = `${place}, ${pincode}`;
                try {
                    const response = await axios.get(`http://localhost:5000/api/findplace`, {
                        params: { input }
                    });

                    if (response.data.candidates && response.data.candidates.length > 0) {
                        const candidate = response.data.candidates[0];

                        newResults[key].push({
                            category: label,
                            name: place,
                            placeId: candidate.place_id ?? 'N/A',
                            phone: candidate.phone ?? 'N/A',
                            website: candidate.website ?? 'N/A',
                            mapsUrl: candidate.maps_url ?? 'N/A',
                            address: candidate.address ?? 'N/A',
                            city: candidate.city ?? 'N/A',
                            state: candidate.state ?? 'N/A',
                            zip: candidate.zip ?? 'N/A',
                            latitude: candidate.latitude ?? 'N/A',
                            longitude: candidate.longitude ?? 'N/A'
                        });
                    } else {
                        newResults[key].push({ name: place, placeId: 'Not Found' });
                    }
                } catch (error) {
                    console.error("Error fetching place details:", error);
                    newResults[key].push({ name: place, placeId: 'Error fetching place details' });
                }
            }
        }

        setResults(newResults);
    };

    return (
        <div className="container">
            <h1>Find Place Details by Category</h1>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Enter Pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="input"
                    />
                </div>

                <div className="input-group">
                    <label><strong>Input Type</strong></label>
                    <select
                        value={inputType}
                        onChange={(e) => setInputType(e.target.value)}
                        className="input"
                    >
                        <option value="comma">Comma Separated</option>
                        <option value="line">New Line Separated</option>
                    </select>
                </div>

                {categories.map(({ key, label }) => (
                    <div className="input-group" key={key}>
                        <label><strong>{label}</strong></label>
                        <textarea
                            placeholder={`Enter ${label} places`}
                            value={inputs[key]}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            className="input"
                        />
                    </div>
                ))}

                <button type="submit" className="submit-button">Find Place Details</button>
            </form>

            <h2>Results</h2>
<div className="results-row">
    {categories.map(({ key, label }) => (
        results[key].length > 0 && (
            <div className="results-column" key={key}>
                <button
                    className="collapsible"
                    onClick={() => {
                        const content = document.getElementById(`content-${key}`);
                        if (content.style.display === 'block') {
                            content.style.display = 'none';
                        } else {
                            content.style.display = 'block';
                        }
                    }}
                >
                    {label}
                </button>
                <div className="content" id={`content-${key}`}>
                    <ul>
                        {results[key].map((result, index) => (
                            <li key={index}>
                                <strong>{result.name}</strong><br />
                                Place ID: {result.placeId}<br />
                                Phone: {result.phone}<br />
                                Website: <a href={result.website} target="_blank" rel="noopener noreferrer">{result.website}</a><br />
                                Google Maps: <a href={result.mapsUrl} target="_blank" rel="noopener noreferrer">{result.mapsUrl}</a><br />
                                Address: {result.address}<br />
                                City: {result.city}, State: {result.state}, Zip: {result.zip}<br />
                                Coordinates: (Lat: {result.latitude}, Lng: {result.longitude})
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )
    ))}
</div>


            {isLoaded && (
                <div className="map-container">
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={
                            Object.values(results).flat().find(r => r.latitude !== 'N/A' && r.longitude !== 'N/A')
                                ? {
                                    lat: parseFloat(Object.values(results).flat().find(r => r.latitude !== 'N/A').latitude),
                                    lng: parseFloat(Object.values(results).flat().find(r => r.longitude !== 'N/A').longitude)
                                }
                                : defaultCenter
                        }
                        zoom={12}
                    >
                        {categories.map(({ key, icon }) =>
                            results[key].map((result, index) =>
                                result.latitude !== 'N/A' && result.longitude !== 'N/A' && (
                                    <Marker
                                        key={`${key}-${index}`}
                                        position={{
                                            lat: parseFloat(result.latitude),
                                            lng: parseFloat(result.longitude)
                                        }}
                                        title={`${result.name} (${result.category})`}
                                        icon={{
                                            url: icon,
                                            scaledSize: new window.google.maps.Size(32, 32)
                                        }}
                                    />
                                )
                            )
                        )}
                    </GoogleMap>
                </div>
            )}
        </div>
    );
};

export default PlaceIdFinder;

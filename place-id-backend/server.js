const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());

const GOOGLE_API_KEY = 'AIzaSyC6pQDk-DSjESrjadT9ECxkOsDyWDwNTek'; // Replace with your actual key

app.get('/api/findplace', async (req, res) => {
    const input = req.query.input;

    try {
        // Step 1: Get place_id
        const findPlaceRes = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
            params: {
                input,
                inputtype: 'textquery',
                fields: 'place_id',
                key: GOOGLE_API_KEY
            }
        });

        const candidates = findPlaceRes.data.candidates;
        if (!candidates || candidates.length === 0) {
            return res.json({ candidates: [] });
        }

        const placeId = candidates[0].place_id;

        // Step 2: Get place details
        const detailsRes = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
                place_id: placeId,
                fields: 'place_id,name,formatted_address,geometry,formatted_phone_number,website,url,address_components',
                key: GOOGLE_API_KEY
            }
        });

        const result = detailsRes.data.result;

        // Extract city, state, zip from address_components
        const getComponent = (type) =>
            result.address_components?.find(comp => comp.types.includes(type))?.long_name || 'N/A';

        const city = getComponent('locality');
        const state = getComponent('administrative_area_level_1');
        const zip = getComponent('postal_code');

        const responseData = {
            place_id: result.place_id,
            name: result.name,
            phone: result.formatted_phone_number || 'N/A',
            website: result.website || 'N/A',
            maps_url: result.url || 'N/A',
            address: result.formatted_address || 'N/A',
            city,
            state,
            zip,
            latitude: result.geometry?.location?.lat || 'N/A',
            longitude: result.geometry?.location?.lng || 'N/A'
        };

        res.json({ candidates: [responseData] });
    } catch (error) {
        console.error('Error fetching place details:', error.message);
        res.status(500).json({ error: 'Failed to fetch place details' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

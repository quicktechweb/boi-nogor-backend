// routes/carrybee.js
// Example Express route — adjust to fit your existing backend structure.
//
// WHY A BACKEND ROUTE (and not calling CarryBee directly from React)?
// Your Client ID / Client Secret / Client Context must stay on the server.
// If the frontend calls developers.carrybee.com directly, anyone using
// browser devtools could read your secret from the network tab.

import express from 'express';
import axios from 'axios';

const router = express.Router();

// ⚠️ Hardcoded per your request. Anyone with access to this file (or your
// GitHub repo, if it's public) can read these. If this repo is ever public,
// switch back to process.env — happy to revert any time you want.
const CARRYBEE_BASE_URL   = 'https://developers.carrybee.com';
const CARRYBEE_CLIENT_ID  = '5b93b53e-489a-4d7c-ab12-3d58a4de4405';
const CARRYBEE_SECRET     = '5b35fba9-d7d0-40de-a01a-ec03c4aebfe0';
const CARRYBEE_CONTEXT    = 'OxNJLhNcSbfeDK7HiYmCBA89yxzgJd';

// Your CarryBee store id (from your CarryBee merchant panel → Stores).
const CARRYBEE_STORE_ID   = '307'; // "Boinagar Bookshop" store, found via GET /api/carrybee/stores

// Real endpoints, confirmed from the CarryBee API docs.
const ORDERS_ENDPOINT          = `${CARRYBEE_BASE_URL}/api/v2/orders`;
const AREA_SUGGESTION_ENDPOINT = `${CARRYBEE_BASE_URL}/api/v2/area-suggestion`;
const STORES_ENDPOINT          = `${CARRYBEE_BASE_URL}/api/v2/stores`;

const carryBeeHeaders = {
    'Content-Type': 'application/json',
    'Client-ID': CARRYBEE_CLIENT_ID,
    'Client-Secret': CARRYBEE_SECRET,
    'Client-Context': CARRYBEE_CONTEXT,
};

// CarryBee needs city_id / zone_id (area_id optional) — it does NOT accept a
// free-text address for routing. We look these up from the customer's address
// text using the area-suggestion search endpoint.
// Docs: GET /api/v2/area-suggestion?search=<text>  (min 3 chars)
//
// A full raw address ("House 5, Road 3, Banani, Dhaka") rarely matches
// exactly, so we try progressively shorter fragments from the end of the
// address (area names are usually written near the end/last comma).
const trySearch = async (search) => {
    if (search.length < 3) return null;
    const res = await axios.get(AREA_SUGGESTION_ENDPOINT, {
        headers: carryBeeHeaders,
        params: { search },
    });
    console.log(`CarryBee area-suggestion search="${search}" ->`, JSON.stringify(res.data));
    return res.data?.data?.items?.[0] || null;
};

const resolveLocation = async (addressText) => {
    const raw = (addressText || '').trim();
    if (raw.length < 3) return null;

    // 1) Comma-separated chunks, most specific (last) first — good for
    //    "House 5, Road 3, Banani, Dhaka" style addresses.
    const commaChunks = raw.split(',').map(c => c.trim()).filter(Boolean).reverse();

    // 2) Word-based candidates — good for short addresses with no commas,
    //    like "38 banglabazar". Strip pure house/road numbers, then try
    //    single words and two-word phrases, starting from the end of the
    //    address (area names are usually written last).
    const words = raw.split(/\s+/).filter(w => w && !/^\d+$/.test(w) && w.length >= 3);
    const wordCandidates = [];
    for (let i = words.length - 1; i >= 0; i--) {
        wordCandidates.push(words[i]);
    }
    for (let i = words.length - 2; i >= 0; i--) {
        wordCandidates.push(`${words[i]} ${words[i + 1]}`);
    }

    const seen = new Set();
    const candidates = [raw.slice(0, 100), ...commaChunks, ...wordCandidates]
        .map(c => c.slice(0, 100))
        .filter(c => c.length >= 3 && !seen.has(c) && seen.add(c));

    for (const candidate of candidates) {
        try {
            const item = await trySearch(candidate);
            if (item) {
                return { city_id: item.city_id, zone_id: item.zone_id, area_id: item.area_id };
            }
        } catch (err) {
            console.error(`area-suggestion lookup failed for "${candidate}":`, err.response?.data || err.message);
        }
    }
    return null;
};

// item_weight is required (grams, 1–25000). We don't track per-book weight
// yet, so estimate ~300g per book and cap at CarryBee's max.
const estimateWeight = (quantity) => Math.min(Math.max((quantity || 1) * 300, 1), 25000);

// ── Helper routes for one-time setup: find or create your store_id ──
// Open these directly in the browser (GET) or call with Postman/curl (POST).

// GET http://localhost:5000/api/carrybee/stores
// Lists stores already registered on your CarryBee account, with their ids.
// ── Debug helper ──
// GET http://localhost:5000/api/carrybee/resolve-test?address=38%20banglabazar
// Shows every candidate string tried against area-suggestion and what came
// back for each — use this instead of digging through terminal logs.
router.get('/resolve-test', async (req, res) => {
    const address = req.query.address || '';
    const raw = address.trim();

    if (raw.length < 3) {
        return res.json({ address, error: 'Address too short (need 3+ chars)' });
    }

    const commaChunks = raw.split(',').map(c => c.trim()).filter(Boolean).reverse();
    const words = raw.split(/\s+/).filter(w => w && !/^\d+$/.test(w) && w.length >= 3);
    const wordCandidates = [];
    for (let i = words.length - 1; i >= 0; i--) wordCandidates.push(words[i]);
    for (let i = words.length - 2; i >= 0; i--) wordCandidates.push(`${words[i]} ${words[i + 1]}`);

    const seen = new Set();
    const candidates = [raw.slice(0, 100), ...commaChunks, ...wordCandidates]
        .map(c => c.slice(0, 100))
        .filter(c => c.length >= 3 && !seen.has(c) && seen.add(c));

    const attempts = [];
    for (const candidate of candidates) {
        try {
            const apiRes = await axios.get(AREA_SUGGESTION_ENDPOINT, {
                headers: carryBeeHeaders,
                params: { search: candidate },
            });
            attempts.push({ candidate, response: apiRes.data });
        } catch (err) {
            attempts.push({ candidate, error: err.response?.data || err.message });
        }
    }

    res.json({ address, candidates, attempts });
});

router.get('/stores', async (req, res) => {
    try {
        const response = await axios.get(STORES_ENDPOINT, { headers: carryBeeHeaders });
        res.json(response.data);
    } catch (err) {
        console.error('List stores failed:', err.response?.data || err.message);
        res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
    }
});

// POST http://localhost:5000/api/carrybee/stores
// Body: { "name": "...", "contact_person_name": "...", "contact_person_number": "...", "address": "..." }
// city_id/zone_id are resolved automatically from `address` using area-suggestion.
// Run this ONCE if GET /stores comes back empty, then copy the returned id
// into CARRYBEE_STORE_ID above.
router.post('/stores', async (req, res) => {
    try {
        const { name, contact_person_name, contact_person_number, contact_person_secondary_number, address } = req.body || {};

        if (!name || !contact_person_name || !contact_person_number || !address) {
            return res.status(400).json({
                error: 'Required fields: name, contact_person_name, contact_person_number, address',
            });
        }

        const location = await resolveLocation(address);
        if (!location) {
            return res.status(422).json({
                error: `Could not resolve city/zone for store address: "${address}". Try a shorter, more specific address (just the area name, e.g. "Banglabazar, Dhaka").`,
            });
        }

        const payload = {
            name,
            contact_person_name,
            contact_person_number,
            contact_person_secondary_number,
            address,
            city_id: location.city_id,
            zone_id: location.zone_id,
            area_id: location.area_id,
        };

        const response = await axios.post(STORES_ENDPOINT, payload, { headers: carryBeeHeaders });
        res.status(response.status).json(response.data);
    } catch (err) {
        console.error('Create store failed:', err.response?.data || err.message);
        res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
    }
});

router.post('/create-orders', async (req, res) => {
  try {
    const { orders } = req.body || {};

    if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ error: 'No orders provided' });
    }

    if (!CARRYBEE_BASE_URL || !CARRYBEE_CLIENT_ID || !CARRYBEE_SECRET || !CARRYBEE_CONTEXT || !CARRYBEE_STORE_ID) {
        console.error('CarryBee env check:', {
            CARRYBEE_BASE_URL: !!CARRYBEE_BASE_URL,
            CARRYBEE_CLIENT_ID: !!CARRYBEE_CLIENT_ID,
            CARRYBEE_SECRET: !!CARRYBEE_SECRET,
            CARRYBEE_CONTEXT: !!CARRYBEE_CONTEXT,
            CARRYBEE_STORE_ID: !!CARRYBEE_STORE_ID,
        });
        return res.status(500).json({
            error: 'Missing CarryBee environment variables. Check .env has CARRYBEE_BASE_URL, CARRYBEE_CLIENT_ID, CARRYBEE_CLIENT_SECRET, CARRYBEE_CLIENT_CONTEXT, CARRYBEE_STORE_ID and that the server was restarted after adding them.',
        });
    }

    const results = [];

    for (const order of orders) {
        try {
            const location = await resolveLocation(order.recipient_address);

            if (!location) {
                results.push({
                    order_id: order.order_id,
                    success: false,
                    error: `Could not resolve city/zone from address: "${order.recipient_address}". Check the Node terminal logs for what was searched, or set city/zone manually.`,
                });
                continue;
            }

            const carryBeePayload = {
                store_id: CARRYBEE_STORE_ID,
                merchant_order_id: order.order_id,
                delivery_type: 1,   // 1 = Normal, 2 = Express
                product_type: 2,    // 1 = Parcel, 2 = Book, 3 = Document
                recipient_phone: order.recipient_phone,
                recipient_name: order.recipient_name,
                recipient_address: order.recipient_address,
                city_id: location.city_id,
                zone_id: location.zone_id,
                area_id: location.area_id,
                product_description: order.item_description,
                item_weight: estimateWeight(order.item_quantity),
                item_quantity: order.item_quantity,
                collectable_amount: order.amount_to_collect,
            };

            const response = await axios.post(ORDERS_ENDPOINT, carryBeePayload, {
                headers: carryBeeHeaders,
            });

            results.push({ order_id: order.order_id, success: true, data: response.data });
        } catch (err) {
            results.push({
                order_id: order.order_id,
                success: false,
                error: err.response?.data || err.message,
            });
        }
    }

    res.json({ results });
  } catch (err) {
    console.error('CarryBee route crashed:', err);
    res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
});

export default router;

// In your main server file (also needs ES module imports):
// import carrybeeRoutes from './routes/carrybee.js';
// app.use('/api/carrybee', carrybeeRoutes);
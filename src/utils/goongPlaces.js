const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY || import.meta.env.GOONG_API_KEY || '';

const PLACE_AUTOCOMPLETE_ENDPOINT = 'https://rsapi.goong.io/Place/AutoComplete';
const PLACE_DETAIL_ENDPOINT = 'https://rsapi.goong.io/Place/Detail';

const normalizeText = (value = '') => String(value || '').trim();

export const hasGoongApiKey = () => Boolean(GOONG_API_KEY);

export const fetchGoongPlaceAutocomplete = async (input = '') => {
  const query = normalizeText(input);
  if (!query || !GOONG_API_KEY) {
    return [];
  }

  const url = `${PLACE_AUTOCOMPLETE_ENDPOINT}?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Goong autocomplete failed (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.predictions) ? payload.predictions : [];
};

export const fetchGoongPlaceDetail = async (placeId = '') => {
  const id = normalizeText(placeId);
  if (!id || !GOONG_API_KEY) {
    return null;
  }

  const url = `${PLACE_DETAIL_ENDPOINT}?place_id=${encodeURIComponent(id)}&api_key=${GOONG_API_KEY}`;
  console.log('📍 [GoongPlaces] Fetching place detail for:', id);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Goong place detail failed (${response.status})`);
  }

  const payload = await response.json();
  console.log('📍 [GoongPlaces] Goong API response:', JSON.stringify(payload, null, 2));

  const result = payload?.result;
  if (!result) {
    console.log('📍 [GoongPlaces] No result in Goong response');
    return null;
  }

  const location = result.geometry?.location;
  const returnData = {
    placeId: result.place_id || id,
    formattedAddress: result.formatted_address || result.name || '',
    name: result.name || '',
    addressComponents: Array.isArray(result.address_components) ? result.address_components : [],
    location:
      location?.lat != null && location?.lng != null
        ? {
            lat: Number(location.lat),
            lng: Number(location.lng),
          }
        : null,
  };

  console.log('📍 [GoongPlaces] Returning place detail:', JSON.stringify(returnData, null, 2));
  return returnData;
};

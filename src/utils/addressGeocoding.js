import addressService from '@services/api/addressService';
import { fetchGoongPlaceDetail } from '@utils/goongPlaces';

const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY || import.meta.env.GOONG_API_KEY || '';

export const buildAddressSearchString = (address = {}) => {
  const parts = [address.details, address.street, address.wardName, address.provinceName]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  return parts.join(', ');
};

export const geocodeAddressForSave = async (address = {}) => {
  if (address?.goongPlaceId) {
    try {
      const placeDetail = await fetchGoongPlaceDetail(address.goongPlaceId);
      if (placeDetail?.location?.lat != null && placeDetail?.location?.lng != null) {
        return {
          location: {
            lat: Number(placeDetail.location.lat),
            lng: Number(placeDetail.location.lng),
          },
          formattedAddress: placeDetail.formattedAddress || buildAddressSearchString(address),
        };
      }
    } catch (error) {
      console.error('Failed to fetch Goong place detail before save:', error);
    }
  }

  const searchString = buildAddressSearchString(address);

  if (!searchString) {
    return null;
  }

  try {
    const response = await addressService.geocodeString({ address: searchString });
    const payload = response?.data || response;
    const location = payload?.location;

    if (!location || location.lat == null || location.lng == null) {
      return null;
    }

    return {
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng),
      },
      formattedAddress: payload?.formattedAddress || searchString,
    };
  } catch (error) {
    console.error('Failed to geocode via backend, trying direct Goong geocode:', error);

    if (!GOONG_API_KEY) {
      return null;
    }

    try {
      const url = `https://rsapi.goong.io/geocode?address=${encodeURIComponent(searchString)}&api_key=${GOONG_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      const result = data?.results?.[0];
      const location = result?.geometry?.location;

      if (location?.lat == null || location?.lng == null) {
        return null;
      }

      return {
        location: {
          lat: Number(location.lat),
          lng: Number(location.lng),
        },
        formattedAddress: result?.formatted_address || searchString,
      };
    } catch (goongError) {
      console.error('Failed to geocode address via direct Goong:', goongError);
      return null;
    }
  }
};

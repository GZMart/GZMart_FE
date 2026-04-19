import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildAutocompleteQuery,
  getAddressAutocompleteSuggestions,
  mergeAddressSuggestions,
  parseGoongAutocompletePredictions,
} from '@utils/addressAutocomplete';
import {
  fetchGoongPlaceAutocomplete,
  fetchGoongPlaceDetail,
  hasGoongApiKey,
} from '@utils/goongPlaces';

const buildTypedFallbackSuggestion = (query = '') => {
  const trimmed = String(query || '').trim();
  if (trimmed.length < 3) {
    return [];
  }

  return [
    {
      source: 'goong',
      id: `typed-${trimmed.toLowerCase()}`,
      placeId: '',
      title: trimmed,
      subtitle: 'Use typed address',
      formattedAddress: trimmed,
      addressComponents: [],
      location: null,
    },
  ];
};

const useAddressAutocomplete = ({ addresses = [], formValues = {}, excludeId = null } = {}) => {
  const [activeField, setActiveField] = useState(null);

  const [goongSuggestions, setGoongSuggestions] = useState([]);
  const [savedSuggestions, setSavedSuggestions] = useState([]);
  const placeDetailsCacheRef = useRef(new Map());

  useEffect(() => {
    let cancelled = false;

    const query = buildAutocompleteQuery(formValues, activeField);
    const normalizedQuery = String(query || '').trim();

    if (activeField !== 'street' && activeField !== 'details') {
      setGoongSuggestions([]);
      setSavedSuggestions([]);
      return undefined;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        if (normalizedQuery.length < 3 || !hasGoongApiKey()) {
          if (!cancelled) {
            const savedItems = getAddressAutocompleteSuggestions(
              addresses,
              formValues?.[activeField] || '',
              {
                excludeId,
                limit: 6,
              }
            );

            setGoongSuggestions(savedItems.length === 0 ? buildTypedFallbackSuggestion(query) : []);
            setSavedSuggestions(savedItems);
          }
          return;
        }

        const predictions = await fetchGoongPlaceAutocomplete(normalizedQuery);
        const goongItems = parseGoongAutocompletePredictions(predictions).slice(0, 5);

        const savedItems = getAddressAutocompleteSuggestions(
          addresses,
          formValues?.[activeField] || '',
          {
            excludeId,
            limit: 6,
          }
        );

        const nextGoongItems =
          goongItems.length > 0 ? goongItems : buildTypedFallbackSuggestion(normalizedQuery);

        if (!cancelled) {
          setGoongSuggestions(nextGoongItems);
          setSavedSuggestions(savedItems);
        }
      } catch (error) {
        console.error('Failed to fetch Goong address suggestions:', error);
        if (!cancelled) {
          const savedItems = getAddressAutocompleteSuggestions(
            addresses,
            formValues?.[activeField] || '',
            {
              excludeId,
              limit: 6,
            }
          );

          setGoongSuggestions(savedItems.length === 0 ? buildTypedFallbackSuggestion(query) : []);
          setSavedSuggestions(savedItems);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [addresses, activeField, excludeId, formValues]);

  const suggestions = useMemo(
    () => mergeAddressSuggestions(goongSuggestions, savedSuggestions),
    [goongSuggestions, savedSuggestions]
  );

  const resolveSuggestionDetails = useCallback(async (suggestion) => {
    if (!suggestion || suggestion.source !== 'goong') {
      return suggestion;
    }

    const placeId = suggestion.placeId || suggestion.id;
    if (!placeId) {
      return suggestion;
    }

    if (suggestion.location && suggestion.addressComponents?.length) {
      return suggestion;
    }

    if (placeDetailsCacheRef.current.has(placeId)) {
      return {
        ...suggestion,
        ...placeDetailsCacheRef.current.get(placeId),
      };
    }

    try {
      const detail = await fetchGoongPlaceDetail(placeId);
      if (!detail) {
        return suggestion;
      }

      placeDetailsCacheRef.current.set(placeId, detail);

      return {
        ...suggestion,
        ...detail,
        placeId,
      };
    } catch (error) {
      console.error('Failed to fetch Goong place detail:', error);
      return suggestion;
    }
  }, []);

  return {
    activeField,
    setActiveField,
    suggestions,
    showSuggestions: Boolean(activeField && suggestions.length > 0),
    resolveSuggestionDetails,
  };
};

export default useAddressAutocomplete;

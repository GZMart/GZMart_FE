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
      // Tránh setState([]) mỗi lần effect chạy khi deps (vd. formValues) đổi reference → vòng lặp re-render
      setGoongSuggestions((prev) => (prev.length === 0 ? prev : []));
      setSavedSuggestions((prev) => (prev.length === 0 ? prev : []));
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
    console.log(
      '📍 [useAddressAutocomplete] Starting resolveSuggestionDetails:',
      JSON.stringify(
        { name: suggestion?.name, source: suggestion?.source, id: suggestion?.id },
        null,
        2
      )
    );

    if (!suggestion || suggestion.source !== 'goong') {
      console.log(
        '📍 [useAddressAutocomplete] Not a Goong suggestion or no suggestion, returning as-is'
      );
      return suggestion;
    }

    const placeId = suggestion.placeId || suggestion.id;
    console.log('📍 [useAddressAutocomplete] Goong placeId:', placeId);

    if (!placeId) {
      console.log('📍 [useAddressAutocomplete] No placeId found');
      return suggestion;
    }

    if (suggestion.location && suggestion.addressComponents?.length) {
      console.log(
        '📍 [useAddressAutocomplete] Suggestion already has location and addressComponents, returning as-is'
      );
      return suggestion;
    }

    if (placeDetailsCacheRef.current.has(placeId)) {
      console.log('📍 [useAddressAutocomplete] Found in cache');
      const cached = placeDetailsCacheRef.current.get(placeId);
      const result = {
        ...suggestion,
        ...cached,
      };
      console.log(
        '📍 [useAddressAutocomplete] Returning cached result:',
        JSON.stringify(result, null, 2)
      );
      return result;
    }

    try {
      const detail = await fetchGoongPlaceDetail(placeId);
      if (!detail) {
        console.log('📍 [useAddressAutocomplete] fetchGoongPlaceDetail returned null');
        return suggestion;
      }

      placeDetailsCacheRef.current.set(placeId, detail);

      const result = {
        ...suggestion,
        ...detail,
        placeId,
      };
      console.log(
        '📍 [useAddressAutocomplete] Returning resolved detail:',
        JSON.stringify(result, null, 2)
      );
      return result;
    } catch (error) {
      console.error('Failed to fetch Goong place detail:', error);
      console.log('📍 [useAddressAutocomplete] Error occurred, returning original suggestion');
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

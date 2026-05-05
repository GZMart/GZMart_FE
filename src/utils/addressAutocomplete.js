const stripVietnameseDiacritics = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

export const normalizeAddressText = (value = '') =>
  stripVietnameseDiacritics(value).toLowerCase().replace(/\s+/g, ' ').trim();

export const buildAddressDisplayString = (address = {}) => {
  const parts = [address.details, address.street, address.wardName, address.provinceName]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  return address.formattedAddress || parts.join(', ');
};

export const buildAddressSearchString = (address = {}) => {
  const parts = [
    address.receiverName,
    address.phone,
    address.details,
    address.street,
    address.wardName,
    address.provinceName,
    address.formattedAddress,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  return normalizeAddressText(parts.join(' '));
};

export const buildAutocompleteQuery = (formValues = {}, activeField = '') => {
  const fieldValue = String(formValues?.[activeField] || '').trim();
  const contextParts = [
    activeField === 'street' ? formValues.details : formValues.street,
    formValues.wardName,
    formValues.provinceName,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  return [fieldValue, ...contextParts].filter(Boolean).join(', ');
};

export const parseGoongSuggestion = (result = {}) => {
  const components = Array.isArray(result.address_components) ? result.address_components : [];
  const parts = components
    .map((component) => String(component?.long_name || component?.short_name || '').trim())
    .filter(Boolean);

  return {
    source: 'goong',
    id: result.place_id || result.reference || result.formatted_address || parts.join('-'),
    title: parts[0] || result.formatted_address || '',
    subtitle: result.formatted_address || parts.slice(1).join(', '),
    formattedAddress: result.formatted_address || parts.join(', '),
    addressComponents: components,
    location: result.geometry?.location
      ? {
          lat: Number(result.geometry.location.lat),
          lng: Number(result.geometry.location.lng),
        }
      : null,
  };
};

export const parseGoongSuggestions = (results = []) =>
  results.map((result) => parseGoongSuggestion(result)).filter((item) => item.formattedAddress);

export const parseGoongAutocompletePrediction = (prediction = {}) => {
  const mainText = String(prediction?.structured_formatting?.main_text || '').trim();
  const secondaryText = String(prediction?.structured_formatting?.secondary_text || '').trim();
  const description = String(prediction?.description || '').trim();

  const displayText = description || [mainText, secondaryText].filter(Boolean).join(', ');

  return {
    source: 'goong',
    id: prediction?.place_id || prediction?.reference || displayText,
    placeId: prediction?.place_id || prediction?.reference || '',
    title: mainText || displayText,
    subtitle: secondaryText || displayText,
    formattedAddress: displayText,
    addressComponents: [],
    location: null,
  };
};

export const parseGoongAutocompletePredictions = (predictions = []) =>
  predictions
    .map((prediction) => parseGoongAutocompletePrediction(prediction))
    .filter((item) => item.formattedAddress);

const normalizeComparableText = (value = '') =>
  normalizeAddressText(String(value || '').replace(/[,]+/g, ' '));

export const mergeAddressSuggestions = (goongSuggestions = [], savedSuggestions = []) => {
  const seen = new Set();
  const merged = [];

  [...goongSuggestions, ...savedSuggestions].forEach((suggestion) => {
    const key = normalizeComparableText(
      suggestion.source === 'goong'
        ? suggestion.formattedAddress || suggestion.title
        : suggestion.formattedAddress || buildAddressDisplayString(suggestion)
    );

    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(suggestion);
  });

  return merged;
};

export const getAddressAutocompleteSuggestions = (addresses = [], query = '', options = {}) => {
  const normalizedQuery = normalizeAddressText(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const { excludeId = null, limit = 6 } = options;

  return addresses
    .filter((address) => address && address._id !== excludeId)
    .map((address) => {
      const searchText = buildAddressSearchString(address);
      const index = searchText.indexOf(normalizedQuery);

      return {
        address,
        searchText,
        score: index === 0 ? 0 : index > 0 ? 1 : 2,
      };
    })
    .filter((item) => item.score < 2)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }

      return buildAddressDisplayString(left.address).localeCompare(
        buildAddressDisplayString(right.address)
      );
    })
    .slice(0, limit)
    .map((item) => item.address);
};

const normalizeName = (value = '') => normalizeAddressText(value);

const findMatchingOption = (options = [], name = '') =>
  options.find((option) => normalizeName(option?.name) === normalizeName(name));

const parseProvinceNameFromComponents = (components = []) => {
  console.log(
    '📍 [addressAutocomplete] parseProvinceNameFromComponents - Input:',
    JSON.stringify(components, null, 2)
  );

  const names = components
    .map((component) => String(component?.long_name || component?.short_name || '').trim())
    .filter(Boolean);

  const result = names[names.length - 1] || '';
  console.log(
    '📍 [addressAutocomplete] parseProvinceNameFromComponents - Result:',
    result,
    JSON.stringify({ extractedNames: names }, null, 2)
  );
  return result;
};

const parseWardNameFromComponents = (components = []) => {
  console.log(
    '📍 [addressAutocomplete] parseWardNameFromComponents - Input:',
    JSON.stringify(components, null, 2)
  );

  const names = components
    .map((component) => String(component?.long_name || component?.short_name || '').trim())
    .filter(Boolean);

  let result;
  if (names.length >= 4) {
    result = names[names.length - 3] || '';
  } else {
    result = names[1] || names[0] || '';
  }

  console.log(
    '📍 [addressAutocomplete] parseWardNameFromComponents - Result:',
    result,
    JSON.stringify({ extractedNames: names, namesLength: names.length }, null, 2)
  );
  return result;
};

export const applySavedAddressSuggestion = (address = {}) => ({
  provinceCode: address.provinceCode || '',
  provinceName: address.provinceName || '',
  wardCode: address.wardCode || '',
  wardName: address.wardName || '',
  street: address.street || '',
  details: address.details || '',
});

export const applyAddressSuggestion = applySavedAddressSuggestion;

export const applyGoongSuggestion = ({
  suggestion = {},
  activeField = '',
  provinces = [],
  wards = [],
  currentFormValues = {},
} = {}) => {
  console.log(
    '📍 [addressAutocomplete] applyGoongSuggestion - Input suggestion:',
    JSON.stringify(
      {
        name: suggestion.name,
        formattedAddress: suggestion.formattedAddress,
        addressComponentsCount: suggestion.addressComponents?.length || 0,
        addressComponents: suggestion.addressComponents,
      },
      null,
      2
    )
  );

  const provinceName = parseProvinceNameFromComponents(suggestion.addressComponents);
  const wardName = parseWardNameFromComponents(suggestion.addressComponents);

  console.log(
    '📍 [addressAutocomplete] Parsed names:',
    JSON.stringify(
      {
        provinceName,
        wardName,
        addressComponentsLength: suggestion.addressComponents?.length,
      },
      null,
      2
    )
  );

  const provinceMatch = findMatchingOption(provinces, provinceName);
  const wardMatch = findMatchingOption(wards, wardName);

  console.log(
    '📍 [addressAutocomplete] Matched options:',
    JSON.stringify(
      {
        provinceName,
        provinceMatch: provinceMatch
          ? { code: provinceMatch.code, name: provinceMatch.name }
          : null,
        wardName,
        wardMatch: wardMatch ? { code: wardMatch.code, name: wardMatch.name } : null,
      },
      null,
      2
    )
  );

  const result = {
    ...currentFormValues,
    [activeField]:
      suggestion.formattedAddress || suggestion.title || currentFormValues?.[activeField] || '',
    provinceName: provinceName || currentFormValues.provinceName || '',
    provinceCode: provinceMatch?.code || currentFormValues.provinceCode || '',
    wardName: wardName || currentFormValues.wardName || '',
    wardCode: wardMatch?.code || currentFormValues.wardCode || '',
    goongPlaceId: suggestion.placeId || suggestion.id || currentFormValues.goongPlaceId || '',
    location: suggestion.location || currentFormValues.location || null,
    formattedAddress:
      suggestion.formattedAddress || currentFormValues.formattedAddress || currentFormValues.street,
  };

  console.log('📍 [addressAutocomplete] Final result:', JSON.stringify(result, null, 2));
  return result;
};

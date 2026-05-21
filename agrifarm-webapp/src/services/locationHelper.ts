/**
 * Resolves a manual location (village, district, state) to coordinates using Nominatim API.
 */
export const resolveCoordinates = async (
  village: string,
  district: string,
  state?: string
): Promise<{ latitude: number; longitude: number } | null> => {
  if (!village && !district) return null;

  // Build clean search query
  const parts = [
    village?.trim(),
    district?.trim(),
    state?.trim(),
    'India'
  ].filter(Boolean);

  const query = parts.join(', ');

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'AgriFarmsApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Nominatim forward geocoding network response failed.');
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
  } catch (err) {
    console.error("Nominatim forward geocoding failed:", err);
  }

  // Fallback: If village is too specific, search only for district, state
  if (village && district) {
    const fallbackParts = [
      district.trim(),
      state?.trim(),
      'India'
    ].filter(Boolean);
    const fallbackQuery = fallbackParts.join(', ');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fallbackQuery)}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'AgriFarmsApp/1.0'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
          };
        }
      }
    } catch (err) {
      console.error("Nominatim fallback geocoding failed:", err);
    }
  }

  return null;
};

import { Item, OutfitSuggestion, Season } from '@/types/wardrobe';
import { WeatherData } from './weatherService';

interface OutfitRecommendation {
  outfit: OutfitSuggestion;
  weatherSummary: string;
  reasonings: {
    category: string;
    reason: string;
  }[];
}

// Map temperature ranges to seasons
function getSeasonFromTemperature(temperature: number): Season {
  if (temperature < 5) return 'winter';
  if (temperature < 15) return 'fall';
  if (temperature < 25) return 'spring';
  return 'summer';
}

// Get appropriate items based on weather conditions
function getWeatherAppropriateItems(
  items: Item[],
  weather: WeatherData
): { [key: string]: Item[] } {
  const { temperature, precipitation, windSpeed, uvIndex } = weather;
  const season = getSeasonFromTemperature(temperature);
  
  // Filter items by season
  const seasonalItems = items.filter(item => 
    item.season.includes(season) || item.season.includes('all')
  );
  
  // Group items by category
  const categorizedItems: { [key: string]: Item[] } = {
    shirts: [],
    pants: [],
    jackets: [],
    shoes: [],
    accessories: [],
    fragrances: []
  };
  
  // Filter and sort items by weather appropriateness
  seasonalItems.forEach(item => {
    if (categorizedItems[item.category]) {
      categorizedItems[item.category].push(item);
    }
  });
  
  // Sort shirts by temperature appropriateness
  categorizedItems.shirts.sort((a, b) => {
    // Prefer breathable materials in hot weather
    if (temperature > 25) {
      const aBreathable = a.material.toLowerCase().includes('cotton') || 
                         a.material.toLowerCase().includes('linen');
      const bBreathable = b.material.toLowerCase().includes('cotton') || 
                         b.material.toLowerCase().includes('linen');
      if (aBreathable && !bBreathable) return -1;
      if (!aBreathable && bBreathable) return 1;
    }
    
    // Prefer warmer materials in cold weather
    if (temperature < 15) {
      const aWarm = a.material.toLowerCase().includes('wool') || 
                   a.material.toLowerCase().includes('fleece');
      const bWarm = b.material.toLowerCase().includes('wool') || 
                   b.material.toLowerCase().includes('fleece');
      if (aWarm && !bWarm) return -1;
      if (!aWarm && bWarm) return 1;
    }
    
    return 0;
  });
  
  // Sort pants by temperature appropriateness
  categorizedItems.pants.sort((a, b) => {
    // Prefer lighter materials in hot weather
    if (temperature > 25) {
      const aLight = a.material.toLowerCase().includes('cotton') || 
                    a.material.toLowerCase().includes('linen');
      const bLight = b.material.toLowerCase().includes('cotton') || 
                    b.material.toLowerCase().includes('linen');
      if (aLight && !bLight) return -1;
      if (!aLight && bLight) return 1;
    }
    
    // Prefer warmer materials in cold weather
    if (temperature < 15) {
      const aWarm = a.material.toLowerCase().includes('wool') || 
                   a.material.toLowerCase().includes('denim');
      const bWarm = b.material.toLowerCase().includes('wool') || 
                   b.material.toLowerCase().includes('denim');
      if (aWarm && !bWarm) return -1;
      if (!aWarm && bWarm) return 1;
    }
    
    return 0;
  });
  
  // Sort jackets by weather appropriateness
  categorizedItems.jackets.sort((a, b) => {
    // Prefer waterproof jackets if it's raining
    if (precipitation > 0.3) {
      const aWaterproof = a.material.toLowerCase().includes('waterproof') || 
                         a.tags.some(tag => tag.toLowerCase().includes('waterproof'));
      const bWaterproof = b.material.toLowerCase().includes('waterproof') || 
                         b.tags.some(tag => tag.toLowerCase().includes('waterproof'));
      if (aWaterproof && !bWaterproof) return -1;
      if (!aWaterproof && bWaterproof) return 1;
    }
    
    // Prefer windproof jackets if it's windy
    if (windSpeed > 5) {
      const aWindproof = a.material.toLowerCase().includes('windproof') || 
                        a.tags.some(tag => tag.toLowerCase().includes('windproof'));
      const bWindproof = b.material.toLowerCase().includes('windproof') || 
                        b.tags.some(tag => tag.toLowerCase().includes('windproof'));
      if (aWindproof && !bWindproof) return -1;
      if (!aWindproof && bWindproof) return 1;
    }
    
    return 0;
  });
  
  // Sort shoes by weather appropriateness
  categorizedItems.shoes.sort((a, b) => {
    // Prefer waterproof shoes if it's raining
    if (precipitation > 0.3) {
      const aWaterproof = a.material.toLowerCase().includes('waterproof') || 
                         a.tags.some(tag => tag.toLowerCase().includes('waterproof'));
      const bWaterproof = b.material.toLowerCase().includes('waterproof') || 
                         b.tags.some(tag => tag.toLowerCase().includes('waterproof'));
      if (aWaterproof && !bWaterproof) return -1;
      if (!aWaterproof && bWaterproof) return 1;
    }
    
    // Prefer boots in cold weather
    if (temperature < 10) {
      const aBoots = a.name.toLowerCase().includes('boot') || 
                    a.tags.some(tag => tag.toLowerCase().includes('boot'));
      const bBoots = b.name.toLowerCase().includes('boot') || 
                    b.tags.some(tag => tag.toLowerCase().includes('boot'));
      if (aBoots && !bBoots) return -1;
      if (!aBoots && bBoots) return 1;
    }
    
    // Prefer sandals or breathable shoes in hot weather
    if (temperature > 25) {
      const aSandals = a.name.toLowerCase().includes('sandal') || 
                      a.tags.some(tag => tag.toLowerCase().includes('sandal'));
      const bSandals = b.name.toLowerCase().includes('sandal') || 
                      b.tags.some(tag => tag.toLowerCase().includes('sandal'));
      if (aSandals && !bSandals) return -1;
      if (!aSandals && bSandals) return 1;
    }
    
    return 0;
  });
  
  // Sort accessories by weather appropriateness
  categorizedItems.accessories.sort((a, b) => {
    // Prefer sunglasses if UV index is high
    if (uvIndex > 5) {
      const aSunglasses = a.name.toLowerCase().includes('sunglasses') || 
                         a.tags.some(tag => tag.toLowerCase().includes('sunglasses'));
      const bSunglasses = b.name.toLowerCase().includes('sunglasses') || 
                         b.tags.some(tag => tag.toLowerCase().includes('sunglasses'));
      if (aSunglasses && !bSunglasses) return -1;
      if (!aSunglasses && bSunglasses) return 1;
    }
    
    // Prefer hats if UV index is high
    if (uvIndex > 7) {
      const aHat = a.name.toLowerCase().includes('hat') || 
                  a.tags.some(tag => tag.toLowerCase().includes('hat'));
      const bHat = b.name.toLowerCase().includes('hat') || 
                  b.tags.some(tag => tag.toLowerCase().includes('hat'));
      if (aHat && !bHat) return -1;
      if (!aHat && bHat) return 1;
    }
    
    // Prefer scarves in cold weather
    if (temperature < 10) {
      const aScarf = a.name.toLowerCase().includes('scarf') || 
                    a.tags.some(tag => tag.toLowerCase().includes('scarf'));
      const bScarf = b.name.toLowerCase().includes('scarf') || 
                    b.tags.some(tag => tag.toLowerCase().includes('scarf'));
      if (aScarf && !bScarf) return -1;
      if (!aScarf && bScarf) return 1;
    }
    
    return 0;
  });
  
  return categorizedItems;
}

// Generate weather summary
function generateWeatherSummary(weather: WeatherData): string {
  const { temperature, description, precipitation, windSpeed, uvIndex } = weather;
  
  let summary = `${temperature.toFixed(0)}°C, ${description}`;
  
  if (precipitation > 0.5) {
    summary += '. High chance of rain';
  } else if (precipitation > 0.2) {
    summary += '. Slight chance of rain';
  }
  
  if (windSpeed > 7) {
    summary += '. Very windy';
  } else if (windSpeed > 4) {
    summary += '. Breezy';
  }
  
  if (uvIndex > 7) {
    summary += '. Very high UV';
  } else if (uvIndex > 5) {
    summary += '. High UV';
  }
  
  return summary;
}

// Generate outfit recommendation based on weather
export function generateOutfitRecommendation(
  items: Item[],
  weather: WeatherData
): OutfitRecommendation | null {
  try {
    const categorizedItems = getWeatherAppropriateItems(items, weather);
    const { temperature, precipitation, windSpeed, uvIndex } = weather;
    
    // Check if we have enough items to create an outfit
    if (
      categorizedItems.shirts.length === 0 ||
      categorizedItems.pants.length === 0 ||
      categorizedItems.shoes.length === 0
    ) {
      return null;
    }
    
    // Select items for the outfit
    const selectedItems: Item[] = [];
    const reasonings: { category: string; reason: string }[] = [];
    
    // Add shirt
    const shirt = categorizedItems.shirts[0];
    selectedItems.push(shirt);
    reasonings.push({
      category: 'Shirt',
      reason: temperature > 25
        ? 'Lightweight and breathable for hot weather'
        : temperature < 10
        ? 'Warm and insulating for cold weather'
        : 'Comfortable for moderate temperatures'
    });
    
    // Add pants
    const pants = categorizedItems.pants[0];
    selectedItems.push(pants);
    reasonings.push({
      category: 'Pants',
      reason: temperature > 25
        ? 'Light and airy for hot weather'
        : temperature < 10
        ? 'Warm and protective for cold weather'
        : 'Suitable for moderate temperatures'
    });
    
    // Add jacket if it's cold, windy, or rainy
    if (temperature < 20 || windSpeed > 5 || precipitation > 0.3) {
      if (categorizedItems.jackets.length > 0) {
        const jacket = categorizedItems.jackets[0];
        selectedItems.push(jacket);
        reasonings.push({
          category: 'Jacket',
          reason: precipitation > 0.3
            ? 'Water-resistant for rainy conditions'
            : windSpeed > 5
            ? 'Protection from the wind'
            : 'Extra layer for cooler temperatures'
        });
      }
    }
    
    // Add shoes
    const shoes = categorizedItems.shoes[0];
    selectedItems.push(shoes);
    reasonings.push({
      category: 'Shoes',
      reason: precipitation > 0.3
        ? 'Water-resistant for rainy conditions'
        : temperature < 10
        ? 'Warm and protective for cold weather'
        : temperature > 25
        ? 'Breathable for hot weather'
        : 'Comfortable for moderate temperatures'
    });
    
    // Add accessories based on weather conditions
    if (categorizedItems.accessories.length > 0) {
      // Sunglasses for high UV
      if (uvIndex > 5) {
        const sunglasses = categorizedItems.accessories.find(item =>
          item.name.toLowerCase().includes('sunglasses') ||
          item.tags.some(tag => tag.toLowerCase().includes('sunglasses'))
        );
        
        if (sunglasses) {
          selectedItems.push(sunglasses);
          reasonings.push({
            category: 'Sunglasses',
            reason: 'Protection from high UV rays'
          });
        }
      }
      
      // Hat for very high UV or cold
      if (uvIndex > 7 || temperature < 5) {
        const hat = categorizedItems.accessories.find(item =>
          item.name.toLowerCase().includes('hat') ||
          item.tags.some(tag => tag.toLowerCase().includes('hat'))
        );
        
        if (hat) {
          selectedItems.push(hat);
          reasonings.push({
            category: 'Hat',
            reason: uvIndex > 7
              ? 'Protection from very high UV rays'
              : 'Keeping your head warm in cold weather'
          });
        }
      }
      
      // Scarf for cold weather
      if (temperature < 10) {
        const scarf = categorizedItems.accessories.find(item =>
          item.name.toLowerCase().includes('scarf') ||
          item.tags.some(tag => tag.toLowerCase().includes('scarf'))
        );
        
        if (scarf) {
          selectedItems.push(scarf);
          reasonings.push({
            category: 'Scarf',
            reason: 'Extra warmth for cold weather'
          });
        }
      }
    }
    
    // Add fragrance if available
    if (categorizedItems.fragrances.length > 0) {
      const fragrance = categorizedItems.fragrances[0];
      selectedItems.push(fragrance);
      reasonings.push({
        category: 'Fragrance',
        reason: 'A complementary scent to complete your outfit'
      });
    }
    
    // Create outfit name based on weather
    let outfitName = '';
    if (temperature > 30) {
      outfitName = 'Hot Weather Ensemble';
    } else if (temperature > 20) {
      outfitName = 'Warm Day Outfit';
    } else if (temperature > 10) {
      outfitName = 'Mild Weather Look';
    } else if (temperature > 0) {
      outfitName = 'Cool Weather Attire';
    } else {
      outfitName = 'Cold Weather Layers';
    }
    
    if (precipitation > 0.5) {
      outfitName = 'Rainy Day ' + outfitName;
    } else if (windSpeed > 7) {
      outfitName = 'Windy Day ' + outfitName;
    } else if (uvIndex > 7) {
      outfitName = 'Sun-Safe ' + outfitName;
    }
    
    // Create the outfit suggestion
    const outfit: OutfitSuggestion = {
      id: Date.now().toString(),
      name: outfitName,
      items: selectedItems.map(item => item.id),
      occasion: 'casual',
      season: getSeasonFromTemperature(temperature),
      imageUrl: selectedItems.length > 0 ? selectedItems[0].imageUrl : undefined,
    };
    
    return {
      outfit,
      weatherSummary: generateWeatherSummary(weather),
      reasonings
    };
  } catch (error) {
    console.error('Error generating outfit recommendation:', error);
    return null;
  }
}
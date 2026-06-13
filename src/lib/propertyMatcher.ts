import propertiesData from '../data/properties.json';
import { Property } from '../types';

const properties = propertiesData as Property[];

export function matchProperties(criteria: Partial<Property>): Property[] {
  return properties.filter((p) => {
    let matches = true;
    if (criteria.listingType && p.listingType !== criteria.listingType.toLowerCase()) matches = false;
    if (criteria.city && p.city.toLowerCase() !== criteria.city.toLowerCase()) matches = false;
    if (criteria.district && p.district.toLowerCase() !== criteria.district.toLowerCase()) matches = false;
    if (criteria.rooms && p.rooms < criteria.rooms) matches = false;
    if (criteria.price) {
      if (criteria.listingType === 'rent' && p.price > criteria.price) matches = false;
      if (criteria.listingType === 'buy' && p.price > criteria.price) matches = false;
    }
    return matches;
  }).slice(0, 3); // Возвращаем топ-3
}
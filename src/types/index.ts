export interface Property {
  id: number;
  listingType: "rent" | "buy";
  propertyType: string;
  city: string;
  district: string;
  rooms: number;
  price: number;
  area: number;
  petsAllowed?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  requirements: Partial<Property>;
  createdAt: string;
  contacted?: boolean;
}
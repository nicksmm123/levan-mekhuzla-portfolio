// Placeholder image used for the static fallback artworks.
// Real artwork images are stored in Supabase Storage and served via the admin CMS.
const placeholder = "/placeholder-artwork.svg";

export interface Artwork {
  id: string;
  /** Only imageUrl is always required; all metadata is optional */
  imageUrl: string;
  titleEn?: string;
  titleKa?: string;
  year?: number | null;
  /** Medium / technique in English */
  medium?: string;
  /** Medium / technique in Georgian */
  mediumKa?: string;
  dimensions?: string;
  category?: 'original-paintings' | 'limited-edition-prints' | 'graphic-works';
  status?: 'available' | 'private-collection';
  price?: number | null;
  sortOrder?: number | null;
}

export const artworks: Artwork[] = [
  {
    id: "aw-1",
    titleEn: "Silence in the Woods",
    titleKa: "სიჩუმე ტყეში",
    year: 2021,
    medium: "Oil on Canvas",
    dimensions: "120 x 90 cm",
    category: "original-paintings",
    status: "available",
    imageUrl: placeholder,
  },
  {
    id: "aw-2",
    titleEn: "Echoes of the Earth",
    titleKa: "დედამიწის ექო",
    year: 2022,
    medium: "Mixed Media, Impasto",
    dimensions: "150 x 150 cm",
    category: "original-paintings",
    status: "private-collection",
    imageUrl: placeholder,
  },
  {
    id: "aw-3",
    titleEn: "Golden Heritage",
    titleKa: "ოქროს მემკვიდრეობა",
    year: 2020,
    medium: "Screen Print on Archival Paper",
    dimensions: "70 x 50 cm",
    category: "limited-edition-prints",
    status: "available",
    imageUrl: placeholder,
  },
  {
    id: "aw-4",
    titleEn: "Kazbegi Mist",
    titleKa: "ყაზბეგის ნისლი",
    year: 2019,
    medium: "Charcoal, Fine Art Print",
    dimensions: "60 x 80 cm",
    category: "limited-edition-prints",
    status: "private-collection",
    imageUrl: placeholder,
  },
  {
    id: "aw-5",
    titleEn: "The Contemplator",
    titleKa: "მჭვრეტელი",
    year: 2023,
    medium: "Oil on Board",
    dimensions: "80 x 60 cm",
    category: "original-paintings",
    status: "available",
    imageUrl: placeholder,
  },
  {
    id: "aw-6",
    titleEn: "Structural Resonance",
    titleKa: "სტრუქტურული რეზონანსი",
    year: 2021,
    medium: "Graphic Screen Print",
    dimensions: "100 x 70 cm",
    category: "graphic-works",
    status: "available",
    imageUrl: placeholder,
  },
  {
    id: "aw-7",
    titleEn: "Vessels and Pomegranates",
    titleKa: "ჭურჭელი და ბროწეული",
    year: 2018,
    medium: "Oil on Canvas",
    dimensions: "90 x 110 cm",
    category: "original-paintings",
    status: "private-collection",
    imageUrl: placeholder,
  },
  {
    id: "aw-8",
    titleEn: "Motion in Stillness",
    titleKa: "მოძრაობა სიჩუმეში",
    year: 2022,
    medium: "Ink on Textured Paper",
    dimensions: "50 x 70 cm",
    category: "graphic-works",
    status: "available",
    imageUrl: placeholder,
  }
];

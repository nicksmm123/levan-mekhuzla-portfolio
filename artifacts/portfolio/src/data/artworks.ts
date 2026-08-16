import artwork1 from "@assets/generated_images/artwork_1.jpg";
import artwork2 from "@assets/generated_images/artwork_2.jpg";
import artwork3 from "@assets/generated_images/artwork_3.jpg";
import artwork4 from "@assets/generated_images/artwork_4.jpg";
import artwork5 from "@assets/generated_images/artwork_5.jpg";
import artwork6 from "@assets/generated_images/artwork_6.jpg";
import artwork7 from "@assets/generated_images/artwork_7.jpg";
import artwork8 from "@assets/generated_images/artwork_8.jpg";

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
    imageUrl: artwork1,
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
    imageUrl: artwork2,
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
    imageUrl: artwork3,
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
    imageUrl: artwork4,
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
    imageUrl: artwork5,
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
    imageUrl: artwork6,
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
    imageUrl: artwork7,
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
    imageUrl: artwork8,
  }
];

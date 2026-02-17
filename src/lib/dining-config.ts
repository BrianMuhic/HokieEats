/**
 * Virginia Tech Dining Halls & Restaurants
 * Source: https://dining.vt.edu/dining_centers.html
 */

export interface DiningLocation {
  id: string;
  name: string;
  restaurants: string[];
}

export const DINING_LOCATIONS: DiningLocation[] = [
  {
    id: "dietrick-hall",
    name: "Dietrick Hall",
    restaurants: ["D2 (all-you-care-to-eat)", "Deet's Place", "DX", "Xpress Lane Market", "Futurebites", "Allee", "Salsa's", "Pan Asia", "Olives", "Mangia", "La Patisserie", "Gauchos Gluten-Free", "Gauchos", "Eden's West Side", "Eden's East Side", "East Side Deli"],
  },
  {
    id: "duckys",
    name: "Ducky's at Graduate Life Center",
    restaurants: ["Ducky's Bubble Tea"],
  },
  {
    id: "hokie-grill",
    name: "Hokie Grill at Owens Hall",
    restaurants: ["Pizza Hut", "Dunkin' VT", "Choolaah", "Chick-Fil-A"],
  },
  {
    id: "owens-food-court",
    name: "Owens Food Court at Owens Hall",
    restaurants: ["Wan", "Variabowl", "Tazon", "Sweets", "Pop's", "Garden", "Freshens", "Franks", "Dish", "Ciotola"],
  },
  {
    id: "perry-place",
    name: "Perry Place at Hitt Hall",
    restaurants: ["Veloce", "Trax Deli", "Solarex Diner", "Smoke", "Rambutan", "Fresh & Feta", "Chick-fil-A", "Addison's Provisions", "AMP Coffee Bar"],
  },
  {
    id: "squires",
    name: "Squires Food Court at Squires Student Center",
    restaurants: ["Corner '24", "Burger '37"],
  },
  {
    id: "turner-place",
    name: "Turner Place at Lavery Hall",
    restaurants: ["Soup Garden", "Qdoba", "Origami", "Jamba", "Dolce e Caffe", "Bruegger's Bagels", "Atomic Pizzeria", "1872 Fire Grill"],
  },
  {
    id: "viva-market",
    name: "Viva Market at Johnston Student Center",
    restaurants: ["Viva Market"],
  },
  {
    id: "viva-too",
    name: "Viva Too at Goodwin Hall",
    restaurants: ["Viva Too"],
  },
  {
    id: "west-end",
    name: "West End at Cochrane Hall",
    restaurants: ["Seven70", "Rosso", "Leaf & Ladle", "JP's Chop House", "Fighting Gobbler", "Blend"],
  },
];

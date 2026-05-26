const seedCustomerDishes = [
  {
    id: "11111111-1111-4111-8111-000000000301",
    menuId: "11111111-1111-4111-8111-000000000201",
    name: "Classic Smash Burger",
    description: "Double beef, cheddar, pickles and burger sauce",
    imageUrl: "",
    price: 229,
    category: 4,
    businessId: "b09437a1-6614-44aa-383b-08deba970de6",
    cookingTime: 14,
    businessDetails: {
      id: "b09437a1-6614-44aa-383b-08deba970de6",
      name: "Burger Hub"
    },
    ingredients: [
      { id: "11111111-1111-4111-8111-000000000401", name: "Beef Patty", weight: 180 },
      { id: "11111111-1111-4111-8111-000000000402", name: "Cheddar", weight: 40 },
      { id: "11111111-1111-4111-8111-000000000403", name: "Pickles", weight: 30 }
    ]
  },
  {
    id: "11111111-1111-4111-8111-000000000302",
    menuId: "11111111-1111-4111-8111-000000000201",
    name: "Loaded Fries",
    description: "Crispy fries with cheddar sauce and bacon",
    imageUrl: "",
    price: 149,
    category: 10,
    businessId: "b09437a1-6614-44aa-383b-08deba970de6",
    cookingTime: 10,
    businessDetails: {
      id: "b09437a1-6614-44aa-383b-08deba970de6",
      name: "Burger Hub"
    },
    ingredients: [
      { id: "11111111-1111-4111-8111-000000000404", name: "Potato", weight: 220 },
      { id: "11111111-1111-4111-8111-000000000405", name: "Cheddar Sauce", weight: 60 }
    ]
  },
  {
    id: "11111111-1111-4111-8111-000000000303",
    menuId: "11111111-1111-4111-8111-000000000202",
    name: "Margherita",
    description: "Tomato sauce, mozzarella and basil",
    imageUrl: "",
    price: 249,
    category: 3,
    businessId: "4176a30e-1d91-4ef2-3834-08deba970de6",
    cookingTime: 13,
    businessDetails: {
      id: "4176a30e-1d91-4ef2-3834-08deba970de6",
      name: "Pizza Palace"
    },
    ingredients: [
      { id: "11111111-1111-4111-8111-000000000406", name: "Mozzarella", weight: 120 },
      { id: "11111111-1111-4111-8111-000000000407", name: "Tomato Sauce", weight: 80 }
    ]
  },
  {
    id: "11111111-1111-4111-8111-000000000304",
    menuId: "11111111-1111-4111-8111-000000000202",
    name: "Carbonara Pasta",
    description: "Creamy pasta with pancetta and parmesan",
    imageUrl: "",
    price: 219,
    category: 5,
    businessId: "4176a30e-1d91-4ef2-3834-08deba970de6",
    cookingTime: 16,
    businessDetails: {
      id: "4176a30e-1d91-4ef2-3834-08deba970de6",
      name: "Pizza Palace"
    },
    ingredients: [
      { id: "11111111-1111-4111-8111-000000000408", name: "Pasta", weight: 180 },
      { id: "11111111-1111-4111-8111-000000000409", name: "Pancetta", weight: 70 }
    ]
  },
  {
    id: "11111111-1111-4111-8111-000000000305",
    menuId: "11111111-1111-4111-8111-000000000203",
    name: "Philadelphia Roll",
    description: "Salmon, cream cheese and cucumber",
    imageUrl: "",
    price: 259,
    category: 6,
    businessId: "5c2635c0-8d24-4660-3836-08deba970de6",
    cookingTime: 15,
    businessDetails: {
      id: "5c2635c0-8d24-4660-3836-08deba970de6",
      name: "Sushi Bar"
    },
    ingredients: [
      { id: "11111111-1111-4111-8111-000000000410", name: "Salmon", weight: 90 },
      { id: "11111111-1111-4111-8111-000000000411", name: "Cream Cheese", weight: 45 }
    ]
  },
  {
    id: "11111111-1111-4111-8111-000000000306",
    menuId: "11111111-1111-4111-8111-000000000203",
    name: "Miso Soup",
    description: "Classic miso broth with tofu and wakame",
    imageUrl: "",
    price: 99,
    category: 1,
    businessId: "5c2635c0-8d24-4660-3836-08deba970de6",
    cookingTime: 8,
    businessDetails: {
      id: "5c2635c0-8d24-4660-3836-08deba970de6",
      name: "Sushi Bar"
    },
    ingredients: [
      { id: "11111111-1111-4111-8111-000000000412", name: "Miso Paste", weight: 30 },
      { id: "11111111-1111-4111-8111-000000000413", name: "Tofu", weight: 50 }
    ]
  },
  {
    id: "11111111-1111-4111-8111-000000000307",
    menuId: "11111111-1111-4111-8111-000000000204",
    name: "Cappuccino",
    description: "Italian coffee with silky milk foam",
    imageUrl: "",
    price: 89,
    category: 0,
    businessId: "c05c2b15-922b-47bd-383a-08deba970de6",
    cookingTime: 5,
    businessDetails: {
      id: "c05c2b15-922b-47bd-383a-08deba970de6",
      name: "Coffee House"
    },
    ingredients: [
      { id: "11111111-1111-4111-8111-000000000414", name: "Espresso", weight: 30 },
      { id: "11111111-1111-4111-8111-000000000415", name: "Milk", weight: 150 }
    ]
  },
  {
    id: "11111111-1111-4111-8111-000000000308",
    menuId: "11111111-1111-4111-8111-000000000204",
    name: "Cheesecake",
    description: "Creamy vanilla cheesecake with berry topping",
    imageUrl: "",
    price: 129,
    category: 7,
    businessId: "c05c2b15-922b-47bd-383a-08deba970de6",
    cookingTime: 4,
    businessDetails: {
      id: "c05c2b15-922b-47bd-383a-08deba970de6",
      name: "Coffee House"
    },
    ingredients: [
      { id: "11111111-1111-4111-8111-000000000416", name: "Cream Cheese", weight: 110 },
      { id: "11111111-1111-4111-8111-000000000417", name: "Berry Topping", weight: 40 }
    ]
  }
];

export default seedCustomerDishes;

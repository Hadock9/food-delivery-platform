export const CategoryMap = {
    0: "Drink",
    1: "Soup",
    2: "Salad",
    3: "Pizza",
    4: "Burger",
    5: "Pasta",
    6: "Sushi",
    7: "Dessert",
    8: "Breakfast",
    9: "Grill",
    10: "SideDish",
    11: "Sauce",
    12: "Vegan",
    13: "KidsMenu",
    14: "SpecialOffer",
};

export const CategoryList = Object.entries(CategoryMap).map(([id, name]) => ({
    id: Number(id),
    name
}));

/** Українські назви категорій для бізнес-UI */
export const CategoryUa = {
    0: "Напої",
    1: "Супи",
    2: "Салати",
    3: "Піца",
    4: "Бургери",
    5: "Паста",
    6: "Суші",
    7: "Десерти",
    8: "Сніданки",
    9: "Гриль",
    10: "Гарніри",
    11: "Соуси",
    12: "Веган",
    13: "Дитяче меню",
    14: "Акція",
};

export const CategoryListUa = Object.entries(CategoryUa).map(([id, name]) => ({
    id: Number(id),
    name,
}));

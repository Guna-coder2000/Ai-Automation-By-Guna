export const ECommerceApplicationLocators = {
  applicationUrl: "https://demowebshop.tricentis.com/",
  searchTerms: "*",
  searchButton: "//button[contains(text(), \"search\")]",
  productItem: "//*[@name=\"productItem\"]",
  addToCartButton: "//button[contains(text(), \"addToCart\")]",
  barNotification: "//*[@name=\"barNotification\"]",
  shoppingCartLink: "//button[contains(text(), \"shoppingCartLink\")]",
  removefromcart: "//button[contains(text(), \"removefromcart\")]",
  updatecart: "//button[contains(text(), \"updatecart\")]",
} as const;

export type ECommerceApplicationLocatorKey = Exclude<keyof typeof ECommerceApplicationLocators, 'applicationUrl'>;

export const TestData = {
  searchTerms: "laptop",
} as const;

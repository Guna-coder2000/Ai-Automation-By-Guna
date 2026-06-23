export const ECommerceApplicationLocators = {
  applicationUrl: "https://demowebshop.tricentis.com/",
  searchTermsInput: "//input[@id=\"small-searchterms\"]",
} as const;

export type ECommerceApplicationLocatorKey = Exclude<keyof typeof ECommerceApplicationLocators, 'applicationUrl'>;

export const TestData = {
  searchTerms: "laptop",
} as const;

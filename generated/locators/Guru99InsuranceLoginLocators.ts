export const Guru99InsuranceLoginLocators = {
  applicationUrl: "https://demo.guru99.com/insurance/v1/index.php",
  email: "//*[@name=\"email\" or @placeholder=\"email\"]",
  password: "//*[@name=\"password\" or @placeholder=\"password\"]",
  loginButton: "text=\"login",
  requestQuotation: "//button[contains(text(), \"requestQuotation\")]",
  breakdowncover: "//*[@name=\"breakdowncover\" or @placeholder=\"breakdowncover\"]",
  saveQuotation: "//button[contains(text(), \"saveQuotation\")]",
} as const;

export type Guru99InsuranceLoginLocatorKey = Exclude<keyof typeof Guru99InsuranceLoginLocators, 'applicationUrl'>;

export const TestData = {
  email: "test@example.com",
  password: "password",
  breakdowncover: "1",
} as const;

export const BankingApplicationCustomerLocators = {
  applicationUrl: "https://www.globalsqa.com/angularJs-protractor/BankingProject/#/login",
  customerLoginButton: "text",
  userSelect: "//*[@name=\"userSelect\" or @placeholder=\"userSelect\"]",
  loginButton: "text",
  depositTab: "//button[contains(text(), \"depositTab\")]",
  amountInput: "//*[@name=\"amountInput\" or @placeholder=\"amountInput\"]",
  depositSubmitButton: "//button[contains(text(), \"depositSubmit\")]",
  message: "//*[@name=\"message\"]",
  withdrawTab: "//button[contains(text(), \"withdrawTab\")]",
  withdrawSubmitButton: "//button[contains(text(), \"withdrawSubmit\")]",
} as const;

export type BankingApplicationCustomerLocatorKey = Exclude<keyof typeof BankingApplicationCustomerLocators, 'applicationUrl'>;

export const TestData = {
  userSelect: "Harry Potter",
  amountInput: "500",
  message: "Transaction successful",
} as const;

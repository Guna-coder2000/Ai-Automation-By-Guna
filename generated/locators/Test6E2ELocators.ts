export const Test6E2ELocators = {
  applicationUrl: "https://demo.automationtesting.in/Register.html",
  firstName: "//input[@placeholder='First Name']",
  lastName: "//input[@placeholder='Last Name']",
  email: "//input[@type='email']",
  phone: "//input[@type='tel']",
  genderMale: "(//input[@type='password'])[1]",
  submit: "//*[@id='submitbtn']",
  alertBoxButton: "//*[contains(@class, 'btn-danger')]",
  group2: "//*[contains(text(), 'Collapsible Group 2 - Single Line Coding')]",
  serializeTab: "//a[@href='#Serialize']",
  readabilityItem: "a:has-text(\"Sakinalium - Readability\")",
  playButton: "//*[@aria-label='Play']",
  username: "//input[@type='email']",
} as const;

export type Test6E2ELocatorKey = Exclude<keyof typeof Test6E2ELocators, 'applicationUrl'>;

export const TestData = {
  firstName: "AI",
  lastName: "Agent",
  email: "ai.agent@example.com",
  phone: "9876543210",
} as const;

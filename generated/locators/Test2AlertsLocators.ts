export const Test2AlertsLocators = {
  applicationUrl: "https://demo.automationtesting.in/Alerts.html",
  alertWithOkTab: "a[href='#OKTab']",
  alertWithOkCancelTab: "a[href='#CancelTab']",
  alertWithTextboxTab: "a[href='#Textbox']",
  alertBoxButton: "(//input[@type='password'])[1]",
  confirmBoxButton: "button.btn-primary",
  promptBoxButton: "button.btn-info",
  promptText: "[name=\"promptText\"], input[placeholder=\"promptText\"]",
  page: "body",
} as const;

export type Test2AlertsLocatorKey = Exclude<keyof typeof Test2AlertsLocators, 'applicationUrl'>;

export const TestData = {
  promptText: "AI Automation",
} as const;

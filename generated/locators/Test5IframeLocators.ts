export const Test5IframeLocators = {
  applicationUrl: "https://demo.automationtesting.in/Youtube.html",
  page: "body",
} as const;

export type Test5IframeLocatorKey = Exclude<keyof typeof Test5IframeLocators, 'applicationUrl'>;

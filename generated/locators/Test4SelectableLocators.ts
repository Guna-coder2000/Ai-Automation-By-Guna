export const Test4SelectableLocators = {
  applicationUrl: "https://demo.automationtesting.in/Selectable.html",
  serializeTab: "text",
  readabilityItem: "b:has-text('Sakinalium - Readability')",
  methodChainingItem: "b:has-text('Sakinalium - Method Chaining')",
  page: "body",
} as const;

export type Test4SelectableLocatorKey = Exclude<keyof typeof Test4SelectableLocators, 'applicationUrl'>;

const clerkAppearance = {
  elements: {
    avatarBox: "border-2 border-border shadow-md !size-9",
    userButtonPopoverCard: "border-2 border-border shadow-md",
    userButtonPopoverActionButton: "hover:bg-accent",
    organizationSwitcherTrigger:
      "border-2 border-border shadow-sm rounded px-2 py-1.5 w-full justify-between",
    organizationSwitcherPopoverCard: "border-2 border-border shadow-md",
    organizationPreviewMainIdentifier: "font-head text-sm",
    organizationPreviewSecondaryIdentifier:
      "font-sans text-xs text-muted-foreground",
    rootBox: "w-full",
    cardBox: "border-2 border-border shadow-md rounded",
    navbar: "border-b-2 border-border",
    navbarButton: "font-sans text-sm hover:bg-accent",
    headerTitle: "font-head",
    profileSectionTitle: "font-head text-sm",
    profileSectionPrimaryButton:
      "border-2 border-border shadow-sm font-sans hover:bg-accent",
    formButtonPrimary:
      "border-2 border-border bg-primary text-primary-foreground shadow-md font-head hover:bg-primary-hover",
    formButtonReset:
      "border-2 border-border shadow-sm font-sans hover:bg-accent",
    formFieldInput:
      "border-2 border-border shadow-sm font-sans focus:shadow-md",
    badge: "border border-border font-sans",
    menuList: "border-2 border-border shadow-md",
    menuItem: "font-sans hover:bg-accent",
  },
} as const;

export { clerkAppearance };

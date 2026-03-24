import type { SuiteCard } from "./types";

export const DEFAULT_CARDS: SuiteCard[] = [
  {
    id: "default-main",
    title: "Main app",
    description:
      "Primary workspace for day-to-day tools and company resources.",
    url: "https://app.whiterock.co.in",
  },
  {
    id: "default-tasks",
    title: "Task Management",
    description: "Plan work, assign owners, and follow tasks to completion.",
    url: "https://tasks.whiterock.co.in",
  },
  {
    id: "default-ims",
    title: "Inventory (IMS)",
    description:
      "Stock levels, warehouses, and inventory movement in one place.",
    url: "https://ims.whiterock.co.in",
  },
  {
    id: "default-b2b",
    title: "B2B Sales",
    description: "Wholesale accounts, orders, and sales operations.",
    url: "https://b2bsales.whiterock.co.in",
  },
  {
    id: "default-field",
    title: "Field Salesman",
    description:
      "Territories, visits, and performance for teams in the field.",
    url: "https://fieldsalesman.whiterock.co.in",
  },
  {
    id: "default-crm",
    title: "CRM",
    description: "Contacts, opportunities, and customer relationship history.",
    url: "https://crm.whiterock.co.in",
  },
];

import type { SuiteCard } from "./types";

/** Default order: Task → B2B → Site Booking → Retail CRM → Field Salesman → IMS */
export const DEFAULT_CARDS: SuiteCard[] = [
  {
    id: "default-tasks",
    title: "Task",
    description: "",
    url: "https://tasks.whiterock.co.in",
  },
  {
    id: "default-b2b",
    title: "B2B",
    description: "",
    url: "https://b2bsales.whiterock.co.in",
  },
  {
    id: "default-site-booking",
    title: "Site Booking",
    description: "",
    url: "https://app.whiterock.co.in",
  },
  {
    id: "default-retail-crm",
    title: "Retail CRM",
    description: "",
    url: "https://crm.whiterock.co.in",
  },
  {
    id: "default-field",
    title: "Field Salesman",
    description: "",
    url: "https://fieldsalesman.whiterock.co.in",
  },
  {
    id: "default-ims",
    title: "IMS",
    description: "",
    url: "https://ims.whiterock.co.in",
  },
];

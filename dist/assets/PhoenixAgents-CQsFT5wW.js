import { j as jsxRuntimeExports } from './react-vendor-a6jLNMWt.js';
import { L as LocationTemplate } from './LocationTemplate-DZGjyChr.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';
import './ui-components-DLW4dShh.js';
import './icons-Bf8A6sFa.js';
import './supabase-D4RJa1Op.js';

const phoenixData = {
  city: "Phoenix",
  state: "Arizona",
  stateAbbr: "AZ",
  slug: "phoenix-real-estate-agents",
  medianPrice: "$450,000",
  marketTrend: "Growing",
  agentCount: "7,100+",
  marketDescription: "Phoenix attracts retirees and California transplants seeking affordability, creating opportunities for agents with strong online lead generation strategies.",
  neighborhoods: [
    "Scottsdale",
    "Paradise Valley",
    "Arcadia",
    "Biltmore",
    "Downtown Phoenix",
    "Tempe",
    "Chandler",
    "Gilbert",
    "Mesa",
    "Ahwatukee",
    "North Phoenix",
    "Camelback East"
  ]
};
function PhoenixAgents() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(LocationTemplate, { location: phoenixData });
}

export { PhoenixAgents as default };

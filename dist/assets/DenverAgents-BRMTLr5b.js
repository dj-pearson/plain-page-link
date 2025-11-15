import { j as jsxRuntimeExports } from './react-vendor-a6jLNMWt.js';
import { L as LocationTemplate } from './LocationTemplate-DZGjyChr.js';
import './charts-DsEHo9_O.js';
import './utils-BhOeSegx.js';
import './ui-components-DLW4dShh.js';
import './icons-Bf8A6sFa.js';
import './supabase-D4RJa1Op.js';

const denverData = {
  city: "Denver",
  state: "Colorado",
  stateAbbr: "CO",
  slug: "denver-real-estate-agents",
  medianPrice: "$615,000",
  marketTrend: "Competitive",
  agentCount: "3,800+",
  marketDescription: "Denver's outdoor lifestyle attracts young professionals and remote workers. Agents who showcase neighborhood amenities and mountain access through Instagram see strong engagement.",
  neighborhoods: [
    "Cherry Creek",
    "Washington Park",
    "Capitol Hill",
    "Highlands",
    "LoDo",
    "RiNo",
    "Congress Park",
    "Park Hill",
    "Stapleton",
    "Uptown",
    "Sloan's Lake",
    "Baker"
  ]
};
function DenverAgents() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(LocationTemplate, { location: denverData });
}

export { DenverAgents as default };

const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import Analytics from "./pages/Analytics";',
  'import Analytics from "./pages/Analytics";\nimport Remnants from "./pages/Remnants";\nimport CareGuide from "./pages/CareGuide";\nimport TaxCredits from "./pages/TaxCredits";'
);
c = c.replace(
  '{ href: "/analytics", icon: BarChart2, label: "Analytics", desc: "Shop analytics" },',
  '{ href: "/analytics", icon: BarChart2, label: "Analytics", desc: "Shop analytics" },\n    { href: "/remnants", icon: Package, label: "Remnants", desc: "Remnant tracker" },\n    { href: "/care", icon: BookOpen, label: "Care Guides", desc: "Stone care guides" },\n    { href: "/tax", icon: DollarSign, label: "Tax Credits", desc: "Tax credit tracker" },'
);
c = c.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2,',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign,'
);
c = c.replace(
  '<Route path="/analytics" component={Analytics} />',
  '<Route path="/analytics" component={Analytics} />\n          <Route path="/remnants" component={Remnants} />\n          <Route path="/care" component={CareGuide} />\n          <Route path="/tax" component={TaxCredits} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');

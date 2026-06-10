const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import TaxCredits from "./pages/TaxCredits";',
  'import TaxCredits from "./pages/TaxCredits";\nimport Profitability from "./pages/Profitability";'
);
c = c.replace(
  '{ href: "/tax", icon: DollarSign, label: "Tax Credits", desc: "Tax credit tracker" },',
  '{ href: "/tax", icon: DollarSign, label: "Tax Credits", desc: "Tax credit tracker" },\n    { href: "/profitability", icon: TrendingUp, label: "Profitability", desc: "Job profit analysis" },'
);
c = c.replace(
  '<Route path="/tax" component={TaxCredits} />',
  '<Route path="/tax" component={TaxCredits} />\n          <Route path="/profitability" component={Profitability} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');

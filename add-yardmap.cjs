const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import Profitability from "./pages/Profitability";',
  'import Profitability from "./pages/Profitability";\nimport YardMap from "./pages/YardMap";'
);
c = c.replace(
  '{ href: "/profitability", icon: TrendingUp, label: "Profitability", desc: "Job profit analysis" },',
  '{ href: "/profitability", icon: TrendingUp, label: "Profitability", desc: "Job profit analysis" },\n    { href: "/yard", icon: Grid, label: "Yard Map", desc: "Visual slab yard" },'
);
c = c.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign,',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid,'
);
c = c.replace(
  '<Route path="/profitability" component={Profitability} />',
  '<Route path="/profitability" component={Profitability} />\n          <Route path="/yard" component={YardMap} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');

const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

// Add imports
c = c.replace(
  'import Leads from "./pages/Leads";',
  'import Leads from "./pages/Leads";\nimport InstallerView from "./pages/InstallerView";\nimport Analytics from "./pages/Analytics";'
);

// Add nav items
c = c.replace(
  '{ href: "/leads", icon: TrendingUp, label: "Leads", desc: "Lead management" },',
  '{ href: "/leads", icon: TrendingUp, label: "Leads", desc: "Lead management" },\n    { href: "/analytics", icon: BarChart2, label: "Analytics", desc: "Shop analytics" },'
);

// Add BarChart2 to lucide imports
c = c.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles,',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2,'
);

// Add routes
c = c.replace(
  '<Route path="/leads" component={Leads} />',
  '<Route path="/leads" component={Leads} />\n          <Route path="/analytics" component={Analytics} />\n          <Route path="/installer" component={InstallerView} />'
);

fs.writeFileSync('client/src/App.tsx', c);
console.log('done');

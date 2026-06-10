const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import BuilderOrderPortal from "./pages/BuilderOrderPortal";',
  'import BuilderOrderPortal from "./pages/BuilderOrderPortal";\nimport Locations from "./pages/Locations";'
);
c = c.replace(
  '{ href: "/builders", icon: Building2, label: "Builders", desc: "Builder portal" },',
  '{ href: "/builders", icon: Building2, label: "Builders", desc: "Builder portal" },\n    { href: "/locations", icon: MapPin, label: "Locations", desc: "Multi-location" },'
);
c = c.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid, Building2,',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid, Building2, MapPin,'
);
c = c.replace(
  '<Route path="/builders" component={BuilderPortal} />',
  '<Route path="/builders" component={BuilderPortal} />\n          <Route path="/locations" component={Locations} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');

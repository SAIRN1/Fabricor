const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import YardMap from "./pages/YardMap";',
  'import YardMap from "./pages/YardMap";\nimport BuilderPortal from "./pages/BuilderPortal";\nimport BuilderOrderPortal from "./pages/BuilderOrderPortal";'
);
c = c.replace(
  '{ href: "/yard", icon: Grid, label: "Yard Map", desc: "Visual slab yard" },',
  '{ href: "/yard", icon: Grid, label: "Yard Map", desc: "Visual slab yard" },\n    { href: "/builders", icon: Building2, label: "Builders", desc: "Builder portal" },'
);
c = c.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid,',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid, Building2,'
);
c = c.replace(
  '<Route path="/yard" component={YardMap} />',
  '<Route path="/yard" component={YardMap} />\n          <Route path="/builders" component={BuilderPortal} />\n          <Route path="/builder/:code" component={BuilderOrderPortal} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');

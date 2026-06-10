const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import Locations from "./pages/Locations";',
  'import Locations from "./pages/Locations";\nimport DesignerPortal from "./pages/DesignerPortal";'
);
c = c.replace(
  '{ href: "/locations", icon: MapPin, label: "Locations", desc: "Multi-location" },',
  '{ href: "/locations", icon: MapPin, label: "Locations", desc: "Multi-location" },\n    { href: "/designers", icon: Palette, label: "Designers", desc: "Designer portal" },'
);
c = c.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid, Building2, MapPin,',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid, Building2, MapPin, Palette,'
);
c = c.replace(
  '<Route path="/locations" component={Locations} />',
  '<Route path="/locations" component={Locations} />\n          <Route path="/designers" component={DesignerPortal} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');

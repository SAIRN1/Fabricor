const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import DesignerPortal from "./pages/DesignerPortal";',
  'import DesignerPortal from "./pages/DesignerPortal";\nimport Suppliers from "./pages/Suppliers";'
);
c = c.replace(
  '{ href: "/designers", icon: Palette, label: "Designers", desc: "Designer portal" },',
  '{ href: "/designers", icon: Palette, label: "Designers", desc: "Designer portal" },\n    { href: "/suppliers", icon: Globe, label: "Suppliers", desc: "Supplier intelligence" },'
);
c = c.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid, Building2, MapPin, Palette,',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid, Building2, MapPin, Palette, Globe,'
);
c = c.replace(
  '<Route path="/designers" component={DesignerPortal} />',
  '<Route path="/designers" component={DesignerPortal} />\n          <Route path="/suppliers" component={Suppliers} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('done');

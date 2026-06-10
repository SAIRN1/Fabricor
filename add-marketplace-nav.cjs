const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(
  'import Benchmarking from "./pages/Benchmarking";',
  'import Benchmarking from "./pages/Benchmarking";\nimport Marketplace from "./pages/Marketplace";'
);
c = c.replace(
  '{ href: "/benchmarking", icon: Award, label: "Benchmarking", desc: "Industry comparison" },',
  '{ href: "/benchmarking", icon: Award, label: "Benchmarking", desc: "Industry comparison" },\n    { href: "/marketplace", icon: Store, label: "Marketplace", desc: "Buy, sell, trade" },'
);
c = c.replace(
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid, Building2, MapPin, Palette, Globe, Award,',
  'import { Mail, Calculator, PenTool, Upload, CreditCard, Layers, BookOpen, Shield, Sparkles, BarChart2, Package, DollarSign, Grid, Building2, MapPin, Palette, Globe, Award, Store,'
);
c = c.replace(
  '<Route path="/benchmarking" component={Benchmarking} />',
  '<Route path="/benchmarking" component={Benchmarking} />\n          <Route path="/marketplace" component={Marketplace} />'
);
fs.writeFileSync('client/src/App.tsx', c);
console.log('nav done');

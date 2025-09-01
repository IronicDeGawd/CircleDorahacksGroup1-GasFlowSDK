import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Code,
  Zap,
  Shield,
  Globe,
  Download,
  Star,
  GitBranch,
  Coins,
  ArrowUpDown,
  Play,
  Copy,
  ExternalLink,
  TrendingUp,
  Activity,
  CheckCircle,
  Users,
  MessageCircle,
  Mail,
  Calendar,
  Target,
  Gift,
  Lightbulb,
  Circle,
  Link as LinkIcon,
  DollarSign,
  Check,
  CreditCard,
  Radio,
  Smartphone,
  RotateCcw,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Landing = () => {
  const [activeDemo, setActiveDemo] = useState("gas-estimation");
  const [terminalOutput] = useState([
    "> Transaction: 0x1a2b3c4d5e6f...",
    "> Saved: $2.45 USDC",
    "> Execution time: 1.2s",
    "> Status: Success"
  ]);

  const securityFeatures = [
    { icon: <CheckCircle className="h-4 w-4" />, label: "Audited Contracts" },
    { icon: <Shield className="h-4 w-4" />, label: "Multi-Sig Protection" },
    { icon: <Activity className="h-4 w-4" />, label: "99.9% Uptime" },
    { icon: <TrendingUp className="h-4 w-4" />, label: "Real-time Monitoring" }
  ];

  const networkStatus = [
    { name: "Ethereum", status: <Circle className="h-3 w-3 fill-green-500 text-green-500" />, gas: "12 gwei" },
    { name: "Arbitrum", status: <Circle className="h-3 w-3 fill-green-500 text-green-500" />, gas: "0.1 gwei" },
    { name: "Base", status: <Circle className="h-3 w-3 fill-green-500 text-green-500" />, gas: "0.05 gwei" }
  ];

  const demoFeatures = [
    { id: "gas-estimation", label: "Gas Estimation", icon: <Zap className="h-4 w-4" /> },
    { id: "chain-bridge", label: "Chain Bridge", icon: <LinkIcon className="h-4 w-4" /> },
    { id: "cost-calculator", label: "Cost Calculator", icon: <DollarSign className="h-4 w-4" /> },
    { id: "analytics", label: "Analytics", icon: <TrendingUp className="h-4 w-4" /> }
  ];

  const stats = [
    { label: "Networks Supported", value: "5+" },
    { label: "Circle CCTP Integration", value: "V2" },
    { label: "Production Ready", value: <Check className="h-4 w-4 text-green-600" /> }
  ];

  return (
    <div className="min-h-screen">
      {/* Asymmetrical Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Main Content */}
            <div className="space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold text-gradient leading-tight">
                GasFlow SDK
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Universal cross-chain gas payments powered by Circle CCTP V2. 
                Pay gas on any chain using USDC from anywhere.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow transition-smooth"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Link to="/documentation">
                  <Button variant="outline" size="lg" className="glass-effect">
                    <Code className="mr-2 h-5 w-5" />
                    Docs
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column - Floating Interactive Elements */}
            <div className="space-y-6">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 w-fit"
              >
                <Star className="h-3 w-3 mr-1" />
                Circle CCTP V2 Complete
              </Badge>

              {/* Live Demo Card */}
              <Card className="p-4 glass-effect hover:shadow-soft transition-smooth">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Live Demo
                  </span>
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="h-4 w-4" />
                    Try Interactive Example
                  </Button>
                </div>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                  <Card key={index} className="p-4 text-center glass-effect">
                    <div className="text-lg font-bold text-gradient mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.label}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="bento-grid gap-6">
            {/* Cross-Chain Gas - Large Card */}
            <Card className="bento-item-large p-8 glass-effect hover:shadow-soft transition-smooth">
              <div className="flex items-start justify-between mb-6">
                <div className="bg-gradient-secondary p-3 rounded-xl shadow-soft">
                  <Zap className="h-6 w-6" />
                </div>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  $1.20 saved
                </Badge>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Cross-Chain Gas</h3>
              <div className="bg-muted/50 p-4 rounded-lg mb-4 font-mono text-sm">
                ETH → USDC → ARB
              </div>
              <p className="text-muted-foreground mb-4">
                Seamlessly handle gas payments across multiple blockchain networks
              </p>
            </Card>

            {/* Smart Paymaster - Medium Card */}
            <Card className="bento-item-medium p-6 glass-effect hover:shadow-soft transition-smooth">
              <div className="bg-gradient-secondary p-3 rounded-xl w-fit mb-4 shadow-soft">
                <Coins className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Paymaster</h3>
              <p className="text-muted-foreground mb-4">
                Intelligent gas sponsorship with flexible payment options
              </p>
              <Button size="sm" className="w-full flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pay Now
              </Button>
            </Card>

            {/* Route Optimization - Medium Card */}
            <Card className="bento-item-medium p-6 glass-effect hover:shadow-soft transition-smooth">
              <div className="bg-gradient-secondary p-3 rounded-xl w-fit mb-4 shadow-soft">
                <ArrowUpDown className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Route Optimization</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Path A:</span>
                  <span>$2.50</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Path B:</span>
                  <span>$3.80</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-green-600">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Optimal:
                  </span>
                  <span>$1.20</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                Find the most cost-effective paths for cross-chain transactions
              </p>
            </Card>

            {/* Enterprise Security - Full Width */}
            <Card className="bento-item-full p-6 glass-effect hover:shadow-soft transition-smooth">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-secondary p-3 rounded-xl shadow-soft">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Enterprise Security</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    {feature.icon}
                    <span className="text-sm font-medium">{feature.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Isolated Components Showcase */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
              Interactive Code Experience
            </h2>
            <p className="text-xl text-muted-foreground">
              See the SDK in action with live examples
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Code Editor */}
            <Card className="p-6 bg-card/95 shadow-window">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-5 w-5 text-primary" />
                  <span className="font-mono text-sm text-muted-foreground">
                    quickstart.js
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Play className="mr-2 h-4 w-4" />
                    Run
                  </Button>
                </div>
              </div>

              <pre className="text-sm font-mono text-foreground bg-muted/50 p-4 rounded-lg overflow-x-auto mb-4">
{`import { GasFlowSDK } from '@gasflow/sdk';

const result = await gasFlow.execute({
  executeOn: 421614,
  payFromChain: 11155111
});`}
              </pre>

              {/* Network Status */}
              <Card className="p-4 bg-muted/30">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Network Status
                </h4>
                <div className="space-y-2">
                  {networkStatus.map((network, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        {network.name}: {network.status}
                      </span>
                      <span>{network.gas}</span>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full mt-3 flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Real-time Updates
                </Button>
              </Card>
            </Card>

            {/* Live Output & Features */}
            <div className="space-y-6">
              {/* Terminal Output */}
              <Card className="p-6 bg-card/95 shadow-window">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Live Terminal Output
                </h4>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm space-y-1">
                  {terminalOutput.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full mt-4 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Try Another Example
                </Button>
              </Card>

              {/* SDK Features Preview */}
              <Card className="p-6 bg-card/95 shadow-window">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  SDK Features Preview
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {demoFeatures.map((feature) => (
                    <Button
                      key={feature.id}
                      size="sm"
                      variant={activeDemo === feature.id ? "default" : "outline"}
                      onClick={() => setActiveDemo(feature.id)}
                      className="text-xs flex items-center gap-1"
                    >
                      {feature.icon}
                      {feature.label}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Click any feature to see it in action
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Floating CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/10 via-accent/5 to-tertiary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/95"></div>
        <div className="container mx-auto relative z-10">
          <Card className="p-8 glass-effect shadow-window max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
                Ready to Optimize Your Gas?
              </h2>
              <p className="text-xl text-muted-foreground">
                Experience the future of cross-chain gas payments with Circle CCTP
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Check Documentation */}
              <Card className="p-6 text-center glass-effect">
                <Link to="/documentation">
                  <Button
                    size="lg"
                    className="bg-gradient-primary hover:shadow-glow transition-smooth w-full mb-4"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Check Documentation
                  </Button>
                </Link>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Code className="h-4 w-4" />
                  Complete API reference & guides
                </div>
              </Card>

              {/* Check Sample Project */}
              <Card className="p-6 text-center glass-effect">
                <a href="https://gasflow-demo-hub.vercel.app" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="lg" className="w-full mb-4">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Check Sample Project
                  </Button>
                </a>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  Live demo & examples
                </div>
              </Card>
            </div>

            {/* Community Section */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="h-5 w-5" />
                <span className="font-semibold">Join the open source community</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Contribute to GasFlow SDK development
              </p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Discord
                </Button>
                <Button size="sm" variant="outline">
                  <GitBranch className="mr-1 h-4 w-4" />
                  GitHub
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Landing;

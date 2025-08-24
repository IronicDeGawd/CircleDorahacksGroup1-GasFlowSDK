import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code, Zap, Shield, Globe, Download, Star, GitBranch, Coins, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Cross-Chain Gas",
      description: "Seamlessly handle gas payments across multiple blockchain networks"
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: "Smart Paymaster",
      description: "Intelligent gas sponsorship with flexible payment options"
    },
    {
      icon: <ArrowUpDown className="h-6 w-6" />,
      title: "Route Optimization",
      description: "Find the most cost-effective paths for cross-chain transactions"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with audited smart contracts"
    }
  ];

  const stats = [
    { label: "Networks Supported", value: "5+" },
    { label: "Circle CCTP Integration", value: "V2" },
    { label: "Production Ready", value: "✓" },
    { label: "Demo Available", value: "Live" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container mx-auto text-center relative z-10">
          <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Star className="h-3 w-3 mr-1" />
            Circle CCTP V2 Integration Complete
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient leading-tight">
            GasFlow SDK
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Universal cross-chain gas payments powered by Circle CCTP V2 and Paymaster integration. 
            Pay for gas on any chain using USDC from any other supported chain.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-smooth">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Link to="/documentation">
              <Button variant="outline" size="lg" className="glass-effect">
                <Code className="mr-2 h-5 w-5" />
                View Documentation
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
              Why Choose GasFlow?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for blockchain developers. Every feature designed to make cross-chain gas management effortless.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 glass-effect hover:shadow-soft transition-smooth">
                <div className="bg-gradient-secondary p-3 rounded-xl w-fit mb-4 shadow-soft">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
              Simple. Powerful. Elegant.
            </h2>
            <p className="text-xl text-muted-foreground">
              Get started with just a few lines of code
            </p>
          </div>

          <Card className="max-w-3xl mx-auto p-8 bg-card/95 shadow-window">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5 text-primary" />
                <span className="font-mono text-sm text-muted-foreground">quickstart.js</span>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            
            <pre className="text-sm font-mono text-foreground bg-muted/50 p-4 rounded-lg overflow-x-auto">
{`import { GasFlowSDK } from '@gasflow/sdk';

const gasFlow = new GasFlowSDK({
  apiKey: process.env.CIRCLE_API_KEY,
  supportedChains: [11155111, 421614, 84532], // Testnet chains
  useProductionCCTP: true,  // Enable real Circle contracts
  signers: signerMap
});

// Execute cross-chain transaction with automatic routing
const result = await gasFlow.execute({
  to: '0x742C7f0f6b6d43A35556D5F7FAF7a93AC8c3b7B8',
  executeOn: 421614,        // Arbitrum Sepolia
  payFromChain: 11155111,   // Ethereum Sepolia
  urgency: 'medium'
}, userAddress);

console.log(\`Transaction: \${result.transactionHash}\`);
console.log(\`Saved: $\${result.estimatedSavings} USDC\`);`}
            </pre>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-background/80"></div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Ready to Optimize Your Gas?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the future of cross-chain gas payments with Circle CCTP V2 integration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-smooth">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="glass-effect">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Github, Code, Star, Zap } from "lucide-react";

const SampleProjects = () => {
  const projects = [
    {
      title: "Cross-Chain DeFi Dashboard",
      description: "Real-time portfolio tracking across multiple chains with automated gas optimization for DeFi transactions.",
      tech: ["React", "TypeScript", "GasFlow SDK"],
      stars: 245,
      featured: true,
      demoUrl: "#",
      githubUrl: "#"
    },
    {
      title: "Multi-Chain Wallet",
      description: "Smart wallet with integrated gas management and cross-chain transaction routing for seamless UX.",
      tech: ["Next.js", "ethers.js", "GasFlow SDK"],
      stars: 189,
      featured: false,
      demoUrl: "#",
      githubUrl: "#"
    },
    {
      title: "NFT Bridge Application",
      description: "Cross-chain NFT bridging platform with intelligent gas estimation and paymaster integration.",
      tech: ["React", "Web3.js", "GasFlow SDK"],
      stars: 312,
      featured: true,
      demoUrl: "#",
      githubUrl: "#"
    },
    {
      title: "DeFi Yield Optimizer",
      description: "Automated yield farming strategy optimizer with cross-chain gas cost analysis and route planning.",
      tech: ["Vue.js", "Nuxt", "GasFlow SDK"],
      stars: 156,
      featured: false,
      demoUrl: "#",
      githubUrl: "#"
    },
    {
      title: "Cross-Chain DEX Aggregator",
      description: "Decentralized exchange aggregator with optimal routing across chains and gas-efficient swaps.",
      tech: ["Svelte", "SvelteKit", "GasFlow SDK"],
      stars: 423,
      featured: true,
      demoUrl: "#",
      githubUrl: "#"
    },
    {
      title: "Gas Analytics Dashboard",
      description: "Monitor and analyze gas usage patterns across networks with predictive pricing and optimization insights.",
      tech: ["Angular", "Chart.js", "GasFlow SDK"],
      stars: 278,
      featured: false,
      demoUrl: "#",
      githubUrl: "#"
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gradient">
            Sample Projects
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore real-world applications built with the GasFlow SDK. 
            Get inspired and kickstart your next cross-chain project with these examples.
          </p>
        </div>

        {/* Featured Projects */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Star className="h-6 w-6 text-primary mr-2" />
            Featured Projects
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.filter(project => project.featured).map((project, index) => (
              <Card key={index} className="p-6 glass-effect hover:shadow-soft transition-smooth">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="secondary" className="bg-gradient-secondary">
                    Featured
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="h-4 w-4 mr-1" />
                    {project.stars}
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((tech, techIndex) => (
                    <Badge key={techIndex} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="bg-gradient-primary flex-1">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Live Demo
                  </Button>
                  <Button variant="outline" size="sm" className="glass-effect">
                    <Github className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* All Projects */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Code className="h-6 w-6 text-secondary mr-2" />
            All Projects
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {projects.filter(project => !project.featured).map((project, index) => (
              <Card key={index} className="p-6 glass-effect hover:shadow-soft transition-smooth">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="h-4 w-4 mr-1" />
                    {project.stars}
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 text-sm">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tech.map((tech, techIndex) => (
                    <Badge key={techIndex} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="glass-effect flex-1">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Demo
                  </Button>
                  <Button variant="outline" size="sm" className="glass-effect">
                    <Github className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="p-8 bg-gradient-hero relative overflow-hidden">
            <div className="absolute inset-0 bg-card/90"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4 text-gradient">
                Ready to Build Your Own?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Start building amazing cross-chain applications with GasFlow SDK. 
                Join our community and share your projects with developers worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-gradient-primary">
                  <Zap className="mr-2 h-4 w-4" />
                  Start Building
                </Button>
                <Button variant="outline" className="glass-effect">
                  Submit Project
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SampleProjects;
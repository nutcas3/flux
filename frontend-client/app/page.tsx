import Link from "next/link";
import { Zap, Shield, TrendingUp, Scale } from "lucide-react";
import { WalletButton } from "@/components/wallet/WalletButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-[#E8D1AB] bg-[#331018] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold text-[#E8D1AB]">
                FLUX
              </Link>
              <div className="hidden md:flex gap-6">
                <Link href="/marketplace" className="text-[#E8D1AB] hover:text-white transition-colors">
                  Marketplace
                </Link>
                <Link href="/provider/dashboard" className="text-[#E8D1AB] hover:text-white transition-colors">
                  Providers
                </Link>
                <Link href="/client/dashboard" className="text-[#E8D1AB] hover:text-white transition-colors">
                  Clients
                </Link>
              </div>
            </div>
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20 md:py-32">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-[#331018] leading-tight">
            Decentralized GPU Power.
          </h1>
          <p className="text-2xl md:text-3xl font-semibold text-[#994D6F] mb-4">
            Forged in Code. Driven by Solana.
          </p>
          <p className="text-lg md:text-xl text-[#6B2850] mb-10 max-w-3xl mx-auto leading-relaxed">
            Rent high-performance GPUs with the transparency of the blockchain. <span className="font-semibold">FLUX</span> combines hardware attestation with dynamic pricing to deliver the most efficient compute marketplace on earth.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/marketplace"
              className="px-8 py-4 bg-[#DC694F] hover:bg-[#994D6F] text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              Browse GPUs
            </Link>
            <Link
              href="/provider/register"
              className="px-8 py-4 bg-white hover:bg-[#E8D1AB] text-[#331018] font-semibold rounded-lg border-2 border-[#E8D1AB] transition-all"
            >
              Become a Provider
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#994D6F] transition-colors">
            <div className="text-4xl font-bold text-[#A926B6] mb-2">1,247</div>
            <div className="text-[#6B2850] font-medium">Active GPUs</div>
          </div>
          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#994D6F] transition-colors">
            <div className="text-4xl font-bold text-[#A926B6] mb-2">$2.4M</div>
            <div className="text-[#6B2850] font-medium">Total Value Locked</div>
          </div>
          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#994D6F] transition-colors">
            <div className="text-4xl font-bold text-[#A926B6] mb-2">8,932</div>
            <div className="text-[#6B2850] font-medium">Jobs Completed</div>
          </div>
          <div className="bg-white border-2 border-[#E8D1AB] rounded-xl p-6 hover:border-[#994D6F] transition-colors">
            <div className="text-4xl font-bold text-[#A926B6] mb-2">543</div>
            <div className="text-[#6B2850] font-medium">Active Providers</div>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-[#331018]">
            Why FLUX?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#DC694F]/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#DC694F]">
                <Zap className="w-10 h-10 text-[#DC694F]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#331018]">⚡ Instant Deployment</h3>
              <p className="text-[#6B2850]">Deploy workloads in seconds. One-click rentals, zero friction.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#A926B6]/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#A926B6]">
                <Shield className="w-10 h-10 text-[#A926B6]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#331018]">🛡️ Hardware Attestation</h3>
              <p className="text-[#6B2850]">What you see is what you get. Verified specs via cryptographic proofs.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#994D6F]/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#994D6F]">
                <TrendingUp className="w-10 h-10 text-[#994D6F]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#331018]">📈 Dynamic Pricing</h3>
              <p className="text-[#6B2850]">Fair, market-driven rates that respond to real-time demand.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-[#6B2850]/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#6B2850]">
                <Scale className="w-10 h-10 text-[#6B2850]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#331018]">⚖️ SLA Enforcement</h3>
              <p className="text-[#6B2850]">Uptime isn't a suggestion—it's guaranteed through staking and slashing.</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#6B2850] to-[#331018] rounded-3xl p-12 md:p-16 text-center mb-20 shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready to get started?</h2>
          <p className="text-xl text-[#E8D1AB] mb-10 max-w-2xl mx-auto">
            Join the future of decentralized compute infrastructure.
          </p>
          <Link
            href="/marketplace"
            className="inline-block px-10 py-5 bg-[#DC694F] hover:bg-[#994D6F] text-white font-bold text-lg rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            Explore Marketplace
          </Link>
        </div>
      </main>

      <footer className="border-t-2 border-[#E8D1AB] bg-[#331018] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-[#E8D1AB] mb-4">
                FLUX
              </div>
              <p className="text-[#E8D1AB]/70 text-sm italic">
                Decentralized GPU marketplace on Solana.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Marketplace</h4>
              <ul className="space-y-2 text-[#E8D1AB]/70 text-sm">
                <li><Link href="/marketplace" className="hover:text-[#E8D1AB] transition-colors">Browse GPUs</Link></li>
                <li><Link href="/marketplace" className="hover:text-[#E8D1AB] transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Providers</h4>
              <ul className="space-y-2 text-[#E8D1AB]/70 text-sm">
                <li><Link href="/provider/register" className="hover:text-[#E8D1AB] transition-colors">Register</Link></li>
                <li><Link href="/provider/dashboard" className="hover:text-[#E8D1AB] transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Resources</h4>
              <ul className="space-y-2 text-[#E8D1AB]/70 text-sm">
                <li><a href="#" className="hover:text-[#E8D1AB] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#E8D1AB] transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#E8D1AB]/30 mt-8 pt-8 text-center text-[#E8D1AB]/70 text-sm">
            © 2026 Flux. Built on Solana.
          </div>
        </div>
      </footer>
    </div>
  );
}

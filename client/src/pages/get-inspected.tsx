import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Video, Target, MapPin, TrendingUp, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>Spektr | Your Eyes at Every Auction</title>
        <meta
          name="description"
          content="Expand your buying power nationwide. Get professional video inspections of vehicles at auctions across the country. Save thousands by avoiding bad cars."
        />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero Section - The Problem & Solution */}
        <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20 px-4 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <img
                  src="/spektr-logo.svg"
                  alt="Spektr"
                  className="w-48 h-48 md:w-64 md:h-64"
                />
              </div>

              {/* Main Headline - The Problem */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Expand Your Inventory Reach<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Without Leaving Your Dealership
                </span>
              </h1>

              {/* Subheadline - The Pain */}
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                Stop limiting yourself to local auctions. Get professional video inspections
                of the exact vehicles you want—anywhere in the country.
              </p>

              {/* Primary CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    Start Inspecting Now
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
                >
                  <Video className="mr-2 h-5 w-5" />
                  See How It Works
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* The Stakes - What's at Risk */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Every Bad Car Costs You Thousands
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Missing condition reports. Unreliable auction photos. No video or inspector insights.
                One bad purchase can wipe out the profit from dozens of good ones.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Problem 1 */}
              <Card className="border-2 border-red-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Limited by Location</h3>
                  <p className="text-gray-600 text-center">
                    You're stuck with whatever shows up at local auctions, missing great inventory opportunities elsewhere.
                  </p>
                </CardContent>
              </Card>

              {/* Problem 2 */}
              <Card className="border-2 border-red-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Risky Remote Buying</h3>
                  <p className="text-gray-600 text-center">
                    Condition reports are incomplete or missing. You're bidding blind on new car trades that arrive late.
                  </p>
                </CardContent>
              </Card>

              {/* Problem 3 */}
              <Card className="border-2 border-red-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Expensive Travel</h3>
                  <p className="text-gray-600 text-center">
                    Flying out, staying overnight, rental cars—just to inspect vehicles in person eats your margins.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* The Solution - Your Guide */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Spektr: Your Eyes at Every Auction
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We've built a trusted inspector network in major auction markets. Get the same
                confidence buying remotely as you have buying in person.
              </p>
            </motion.div>

            {/* Value Propositions */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mb-4">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Like You're There in Person</h3>
                  <p className="text-gray-700 mb-4">
                    Professional video inspections with audio commentary from experienced inspectors.
                    See every angle, hear their honest assessment, confirm or challenge condition reports.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Complete video walkarounds with inspector insights</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Focus on new car trades that arrive late to auction</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Catch missed details in incomplete condition reports</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mb-4">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Find Your Exact Vehicles</h3>
                  <p className="text-gray-700 mb-4">
                    Set up your buy box with the specific makes, models, and criteria you want.
                    We'll find matching vehicles across multiple auctions and get them inspected.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Subscribe to weekly inspections or buy singles</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Review organized packages by auction date</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">Make confident bids from your desk</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Coverage Map */}
        <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nationwide Coverage at Major Auction Markets
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Our trusted inspector network inspects new car trades at multiple auctions per week
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
                {['Chicago', 'Memphis', 'Nashville', 'Birmingham', 'Atlanta', 'Orlando'].map((city) => (
                  <div key={city} className="bg-white rounded-lg p-4 shadow-md">
                    <MapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">{city}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* The Plan - 3 Simple Steps */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                It's Simple to Get Started
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mx-auto mb-6">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Define Your Buy Box</h3>
                <p className="text-gray-600 text-lg">
                  Tell us the specific makes, models, years, and criteria for vehicles you want to buy.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mx-auto mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Video Inspections</h3>
                <p className="text-gray-600 text-lg">
                  Our inspector network finds your vehicles and delivers professional video inspections.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mx-auto mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Bid with Confidence</h3>
                <p className="text-gray-600 text-lg">
                  Review organized packages by auction date and make informed buying decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Real Value - ROI */}
        <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center mb-6">
                <TrendingUp className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Your ROI? Every Bad Car You Don't Buy
              </h2>
              <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                When a bad car costs you thousands in repairs, reconditioning, and lost time—
                Spektr pays for itself by helping you avoid just one mistake.
              </p>
              <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md mx-auto">
                <p className="text-gray-600 mb-2">Average cost of one bad purchase</p>
                <p className="text-5xl font-bold text-red-600 mb-4">$5,000+</p>
                <p className="text-gray-600 mb-2">Cost of Spektr inspection</p>
                <p className="text-3xl font-bold text-green-600">A fraction of that</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <ShieldCheck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Trusted Inspector Network</h3>
                <p className="text-gray-600">Experienced professionals at every location</p>
              </div>
              <div>
                <Video className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Quality</h3>
                <p className="text-gray-600">Complete video with audio commentary</p>
              </div>
              <div>
                <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Exact Vehicles</h3>
                <p className="text-gray-600">Focus on what you actually want to buy</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-blue-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Expand Your Buying Power?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join dealers who are already buying better inventory nationwide with Spektr
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-white text-blue-900 hover:bg-gray-100 font-bold px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    Get Started Now
                  </Button>
                </Link>
                <Link href="/inspector">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
                  >
                    Inspector Portal
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

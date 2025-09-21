import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>Spektr | Buyer Matrix Powered Vehicle Inspection Management</title>
        <meta
          name="description"
          content="Streamline your vehicle inspection process with Buyer Matrix powered management tools. Join thousands of inspectors and dealers using Spektr."
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          rel="stylesheet"
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900/20 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-6 py-12">

          {/* Main Content Container */}
          <div className="text-center">

            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-12"
            >
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <img
                    src="/spektr-logo.svg"
                    alt="Spektr"
                    className="w-96 h-96 md:w-[32rem] md:h-[32rem]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl"></div>
                </div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6"
              >
                SPEKTR
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-xl md:text-2xl text-white max-w-2xl mx-auto"
              >
                Buyer Matrix Powered Vehicle Inspection Management
              </motion.p>
            </motion.div>

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >

              {/* Dashboard Button */}
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-12 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-3">
                    <i className="fas fa-th-large text-xl"></i>
                    <span>Access Dashboard</span>
                  </div>
                </Button>
              </Link>

              {/* Inspector Portal Button */}
              <Link href="/inspector">
                <Button
                  size="lg"
                  variant="outline"
                  className="group relative overflow-hidden border-2 border-gray-300 hover:border-purple-600 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-semibold px-12 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-3">
                    <i className="fas fa-user-shield text-xl"></i>
                    <span>Inspector Portal</span>
                  </div>
                </Button>
              </Link>
            </motion.div>

            {/* Subtle Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="text-sm text-gray-500 dark:text-gray-400 mt-12"
            >
              Streamline your vehicle inspection process with cutting-edge technology
            </motion.p>
          </div>
        </div>

        {/* Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/15 to-purple-600/15 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-green-400/15 to-blue-600/15 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-400/5 to-blue-600/5 blur-3xl"></div>
        </div>
      </div>
    </>
  );
}
import { Link } from "react-router-dom";
import { Home, Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Home className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold text-white">
                AgentBio.net
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Professional real estate agent portfolio links to showcase your properties and capture qualified leads.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <a href="/#features" className="text-gray-400 hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Real Estate Tips
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Market Insights
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Agent Guides
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="text-gray-400 hover:text-white transition-colors">
                  DMCA Policy
                </Link>
              </li>
              <li>
                <Link to="/acceptable-use" className="text-gray-400 hover:text-white transition-colors">
                  Acceptable Use
                </Link>
              </li>
              <li>
                <a href="mailto:legal@agentbio.net" className="text-gray-400 hover:text-white transition-colors">
                  Legal Inquiries
                </a>
              </li>
              <li>
                <a href="mailto:support@agentbio.net" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Equal Housing Opportunity & Disclaimers Section */}
        <div className="border-t border-gray-800 pt-8 pb-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center mb-6">
            <div className="flex items-center gap-3">
              {/* Equal Housing Opportunity Logo */}
              <div className="bg-white rounded p-2">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" fill="white"/>
                  <path d="M50 10L20 40H30V90H70V40H80L50 10Z" fill="#000"/>
                  <rect x="40" y="50" width="20" height="20" fill="white"/>
                  <text x="50" y="66" fontFamily="Arial" fontSize="20" fontWeight="bold" fill="#000" textAnchor="middle">=</text>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm">Equal Housing Opportunity</p>
                <p className="text-gray-400 text-xs">
                  AgentBio.net is committed to fair housing compliance
                </p>
              </div>
            </div>
          </div>
          
          {/* Platform Disclaimers */}
          <div className="space-y-3 text-xs text-gray-500 text-center max-w-4xl mx-auto">
            <p className="font-semibold text-gray-400">
              Important Legal Notices
            </p>
            <p>
              <strong className="text-gray-400">Passive Hosting Platform:</strong> AgentBio.net is a passive hosting platform and interactive computer service under 47 U.S.C. § 230. 
              We do NOT create, verify, endorse, or take responsibility for any content posted by agents, including property listings, photographs, descriptions, pricing, 
              credentials, testimonials, or any other information.
            </p>
            <p>
              <strong className="text-gray-400">Agent Responsibility:</strong> All real estate agents using this platform are solely and exclusively responsible for: 
              (1) the accuracy of all property information and credentials, (2) copyright compliance for all photos and materials they upload, 
              (3) Fair Housing Act compliance in all listings and content, (4) obtaining photographer permissions and license authorizations, 
              and (5) compliance with state licensing and advertising requirements in all jurisdictions where they hold licenses.
            </p>
            <p>
              <strong className="text-gray-400">Fair Housing Compliance:</strong> All listings must comply with the Fair Housing Act (42 U.S.C. § 3604) and applicable state fair housing laws 
              prohibiting discrimination based on race, color, religion, sex, handicap, familial status, national origin, or other protected characteristics.
            </p>
            <p>
              <strong className="text-gray-400">Copyright Notice:</strong> Violations of copyright law may result in liability, including statutory damages ranging from $750 to $150,000 per work. 
              Users who receive three valid DMCA notices within 12 months will have their accounts permanently terminated. See our DMCA Policy for details.
            </p>
            <p className="pt-2">
              For complete terms, please review our <Link to="/terms" className="text-blue-400 hover:text-blue-300">Terms of Service</Link>, {" "}
              <Link to="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>, and {" "}
              <Link to="/dmca" className="text-blue-400 hover:text-blue-300">DMCA Policy</Link>.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-center md:text-left text-gray-400">
              &copy; {new Date().getFullYear()} AgentBio.net. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm flex-wrap justify-center">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <span className="text-gray-600">•</span>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <span className="text-gray-600">•</span>
              <Link to="/dmca" className="text-gray-400 hover:text-white transition-colors">
                DMCA
              </Link>
              <span className="text-gray-600">•</span>
              <Link to="/acceptable-use" className="text-gray-400 hover:text-white transition-colors">
                Acceptable Use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

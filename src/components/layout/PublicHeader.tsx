import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Home className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">
            AgentBio.net
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="/#features"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Features
          </a>
          <Link
            to="/blog"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Blog
          </Link>
          <Link
            to="/pricing"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="/auth/login"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/auth/register"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}

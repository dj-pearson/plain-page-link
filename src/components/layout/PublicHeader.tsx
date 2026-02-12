import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Home, Menu, X } from "lucide-react";

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileNavRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu on Escape key (WCAG 2.1.1)
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  // Focus first menu item when menu opens
  useEffect(() => {
    if (isMenuOpen && mobileNavRef.current) {
      const firstLink = mobileNavRef.current.querySelector<HTMLElement>("a, button");
      firstLink?.focus();
    }
  }, [isMenuOpen]);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <header
      className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50"
      role="banner"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="AgentBio.net - Go to homepage">
          <Home className="h-8 w-8 text-blue-600" aria-hidden="true" />
          <span className="text-2xl font-bold text-gray-900">
            AgentBio.net
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
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

        {/* Mobile Menu Button */}
        <button
          ref={menuButtonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav
          ref={mobileNavRef}
          id="mobile-navigation"
          className="md:hidden border-t bg-white"
          aria-label="Mobile navigation"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4" role="list">
            <a
              href="/#features"
              className="text-gray-600 hover:text-gray-900 transition-colors py-2 min-h-[44px] flex items-center"
              onClick={closeMenu}
              role="listitem"
            >
              Features
            </a>
            <Link
              to="/blog"
              className="text-gray-600 hover:text-gray-900 transition-colors py-2 min-h-[44px] flex items-center"
              onClick={closeMenu}
              role="listitem"
            >
              Blog
            </Link>
            <Link
              to="/pricing"
              className="text-gray-600 hover:text-gray-900 transition-colors py-2 min-h-[44px] flex items-center"
              onClick={closeMenu}
              role="listitem"
            >
              Pricing
            </Link>
            <Link
              to="/auth/login"
              className="text-gray-600 hover:text-gray-900 transition-colors py-2 min-h-[44px] flex items-center"
              onClick={closeMenu}
              role="listitem"
            >
              Log In
            </Link>
            <Link
              to="/auth/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center min-h-[44px] flex items-center justify-center"
              onClick={closeMenu}
              role="listitem"
            >
              Get Started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

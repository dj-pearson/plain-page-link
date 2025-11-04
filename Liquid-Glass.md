
/* Liquid Glass Design System - Complete Design System Export */

/* =============================================== */
/* CSS VARIABLES */
/* =============================================== */
/* Liquid Glass Design System - CSS Variables */
:root {
  /* Dark theme (default) */
  --background: 220 13% 9%;
  --foreground: 220 9% 98%;
  --card: 220 13% 11%;
  --card-foreground: 220 9% 98%;
  --popover: 220 13% 11%;
  --popover-foreground: 220 9% 98%;
  --primary: 220 9% 98%;
  --primary-foreground: 220 13% 9%;
  --secondary: 220 13% 15%;
  --secondary-foreground: 220 9% 98%;
  --muted: 220 13% 15%;
  --muted-foreground: 220 9% 63%;
  --accent: 220 13% 15%;
  --accent-foreground: 220 9% 98%;
  --destructive: 0 62% 30%;
  --destructive-foreground: 220 9% 98%;
  --border: 220 13% 15%;
  --input: 220 13% 15%;
  --ring: 220 9% 98%;
  --radius: 0.75rem;
  
  /* Glass morphism variables */
  --glass-background: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  --glass-blur: blur(16px);
  --prismatic-gradient: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%,
    rgba(128, 208, 199, 0.12) 25%,
    rgba(161, 196, 253, 0.12) 50%,
    rgba(194, 233, 251, 0.12) 75%,
    rgba(255, 255, 255, 0.1) 100%);
}

.light {
  --background: 0 0% 100%;
  --foreground: 220 13% 9%;
  --card: 0 0% 100%;
  --card-foreground: 220 13% 9%;
  --popover: 0 0% 100%;
  --popover-foreground: 220 13% 9%;
  --primary: 220 13% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 220 13% 96%;
  --secondary-foreground: 220 13% 9%;
  --muted: 220 13% 96%;
  --muted-foreground: 220 13% 45%;
  --accent: 220 13% 96%;
  --accent-foreground: 220 13% 9%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 220 13% 9%;
  
  /* Light mode glass variables */
  --glass-background: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(0, 0, 0, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* =============================================== */
/* TYPOGRAPHY */
/* =============================================== */
/* Liquid Glass Typography */
body {
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  letter-spacing: -0.025em;
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.glass-heading {
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1.1;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.9) 0%,
    rgba(128, 208, 199, 0.8) 25%,
    rgba(161, 196, 253, 0.8) 50%,
    rgba(194, 233, 251, 0.8) 75%,
    rgba(255, 255, 255, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glass-subheading {
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  letter-spacing: -0.01em;
  color: hsl(var(--foreground) / 0.85);
}

.glass-body {
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  line-height: 1.7;
  color: hsl(var(--muted-foreground));
}

.glass-accent {
  background: linear-gradient(90deg, 
    rgba(128, 208, 199, 1) 0%,
    rgba(161, 196, 253, 1) 50%,
    rgba(194, 233, 251, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 400;
}

/* =============================================== */
/* EFFECTS & UTILITIES */
/* =============================================== */
/* Liquid Glass Effects */
.liquid-glass {
  background: var(--glass-background);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.liquid-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--prismatic-gradient);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.liquid-glass:hover::before {
  opacity: 1;
}

/* Disable all animations for liquid glass */
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0.1s !important;
}

/* =============================================== */
/* TAILWIND CONFIG EXTENSION */
/* =============================================== */
/*
Add this to your tailwind.config.js:

module.exports = {
  theme: {
    extend: {
      // Liquid Glass - Tailwind Config
colors: {
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))'
  },
  secondary: {
    DEFAULT: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))'
  },
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))'
  },
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))'
  },
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))'
  },
  popover: {
    DEFAULT: 'hsl(var(--popover))',
    foreground: 'hsl(var(--popover-foreground))'
  },
  card: {
    DEFAULT: 'hsl(var(--card))',
    foreground: 'hsl(var(--card-foreground))'
  },
  glass: {
    background: 'var(--glass-background)',
    border: 'var(--glass-border)',
    shadow: 'var(--glass-shadow)'
  }
}
    }
  }
}
*/

/* =============================================== */
/* COMPONENT USAGE EXAMPLES */
/* =============================================== */
/*

// BUTTON COMPONENT
// Liquid Glass Button Variants
const liquidGlassButtonVariants = cva(
  "relative inline-flex items-center justify-center font-light tracking-tight transition-none",
  {
    variants: {
      variant: {
        default: "bg-glass-background backdrop-blur-md border border-glass-border text-foreground hover:bg-foreground/10",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        default: "h-10 px-4 py-2 rounded-xl",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8"
      }
    }
  }
)


// CARD COMPONENT
// Liquid Glass Card Component
<Card className="bg-glass-background backdrop-blur-md border-glass-border shadow-lg">
  <CardHeader>
    <CardTitle className="font-light tracking-tight">Glass Card</CardTitle>
    <CardDescription className="font-light">Transparent card with backdrop blur</CardDescription>
  </CardHeader>
  <CardContent className="font-light">
    Content with perfect glass morphism effect
  </CardContent>
</Card>


// NAVIGATION COMPONENT
// Liquid Glass Navigation
<nav className="flex items-center gap-1 p-2 bg-glass-background backdrop-blur-md border border-glass-border rounded-full">
  <a className="px-4 py-2 rounded-full text-sm font-light text-foreground/90 hover:bg-foreground/10 hover:text-foreground">
    Home
  </a>
  <a className="px-4 py-2 rounded-full text-sm font-light text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
    About
  </a>
  <a className="px-4 py-2 rounded-full text-sm font-light text-muted-foreground hover:bg-foreground/10 hover:text-foreground">
    Contact
  </a>
</nav>


// CHART COMPONENT
// Liquid Glass Chart Container
<div className="bg-glass-background backdrop-blur-md border border-glass-border rounded-xl p-6">
  <h3 className="text-lg font-light tracking-tight mb-4">Analytics</h3>
  <div className="h-64 bg-background/50 rounded-lg p-4">
    {/* Chart component goes here */}
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke="hsl(var(--foreground))" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>


// THEMETOGGLE COMPONENT
// Liquid Glass Theme Toggle
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="
        flex items-center gap-2 px-4 py-2
        bg-glass-background backdrop-blur-md
        border border-glass-border rounded-full
        text-foreground font-light
        hover:bg-foreground/10
      "
    >
      <Sun className="h-4 w-4 dark:opacity-0 transition-opacity" />
      <Moon className="h-4 w-4 opacity-0 dark:opacity-100 transition-opacity" />
      <span className="text-sm">Toggle Theme</span>
    </button>
  );
};

*/

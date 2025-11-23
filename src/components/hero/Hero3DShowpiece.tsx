import { useEffect, useRef } from 'react';
import { CheckCircle2, TrendingUp, Home, Star } from 'lucide-react';

interface Hero3DShowpieceProps {
    className?: string;
    height?: string;
}

export function Hero3DShowpiece({ className = '', height = '600px' }: Hero3DShowpieceProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
            const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

            container.style.setProperty('--mouse-x', `${x * 15}deg`);
            container.style.setProperty('--mouse-y', `${-y * 15}deg`);
        };

        container.addEventListener('mousemove', handleMouseMove);
        return () => container.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`relative w-full overflow-hidden ${className}`}
            style={{
                height,
                perspective: '1200px',
                // @ts-ignore
                '--mouse-x': '0deg',
                '--mouse-y': '0deg'
            }}
        >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-teal-50/50 dark:from-slate-950 dark:via-blue-950/30 dark:to-teal-950/30" />

            {/* Floating Cards Container */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                    className="relative w-full h-full max-w-[1400px] mx-auto"
                    style={{
                        transform: 'rotateX(var(--mouse-y)) rotateY(var(--mouse-x))',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.1s ease-out'
                    }}
                >
                    {/* --- RIGHT SIDE: Main Profile Stack --- */}
                    <div
                        className="absolute right-[10%] top-[20%] glass-card profile-card"
                        style={{
                            transform: 'translateZ(80px)',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        <div className="relative z-10 p-8 flex flex-col items-center">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                                    SJ
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                                    <CheckCircle2 size={16} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Sarah Johnson</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Luxury Real Estate Specialist</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                <Home size={12} />
                                <span>Beverly Hills, CA</span>
                            </div>
                        </div>
                    </div>

                    {/* --- FAR RIGHT: Listing Card --- */}
                    <div
                        className="absolute right-[2%] top-[55%] glass-card listing-card"
                        style={{
                            transform: 'translateZ(120px) rotateY(-10deg)',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        <div className="relative z-10">
                            <div className="h-32 bg-gradient-to-br from-slate-300 to-slate-400 rounded-t-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
                                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-bold">
                                    $2,450,000
                                </div>
                                <div className="absolute top-2 right-2 bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg transform rotate-12">
                                    SOLD
                                </div>
                            </div>
                            <div className="p-4">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Modern Hills Villa</h4>
                                <p className="text-xs text-gray-500">4 Bed • 3.5 Bath • 3,200 sqft</p>
                            </div>
                        </div>
                    </div>

                    {/* --- CENTER BOTTOM: Stats Card (Deals) --- */}
                    <div
                        className="absolute left-[45%] bottom-[15%] glass-card stats-card"
                        style={{
                            transform: 'translateZ(60px) rotateX(10deg)',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        <div className="relative z-10 p-6 text-center">
                            <div className="text-4xl font-bold text-blue-500 mb-2">28</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1">
                                <Star size={14} />
                                <span>Deals Closed</span>
                            </div>
                        </div>
                    </div>

                    {/* --- LEFT SIDE: Stats Card (Leads) --- */}
                    {/* Positioned to float behind/near the text area but not block it */}
                    <div
                        className="absolute left-[5%] bottom-[20%] glass-card stats-card opacity-80"
                        style={{
                            transform: 'translateZ(30px) rotateY(15deg)',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        <div className="relative z-10 p-6 text-center">
                            <div className="text-4xl font-bold text-emerald-500 mb-2">142</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1">
                                <TrendingUp size={14} />
                                <span>Active Leads</span>
                            </div>
                        </div>
                    </div>

                    {/* Floating Accent Orbs */}
                    <div
                        className="floating-orb orb-1"
                        style={{
                            right: '25%',
                            top: '15%',
                            transform: 'translateZ(-50px)',
                        }}
                    />
                    <div
                        className="floating-orb orb-2"
                        style={{
                            left: '10%',
                            bottom: '30%',
                            transform: 'translateZ(-80px)',
                        }}
                    />
                </div>
            </div>

            <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          animation: float 8s ease-in-out infinite;
          transition: transform 0.1s ease-out;
        }

        .profile-card {
          width: 300px;
          animation-delay: 0s;
        }

        .listing-card {
          width: 260px;
          animation-delay: 1.5s;
        }

        .stats-card {
          width: 180px;
          animation-delay: 2.5s;
        }

        .floating-orb {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(45, 212, 191, 0.2));
          filter: blur(40px);
          animation: pulse 6s ease-in-out infinite;
        }

        .orb-1 { animation-delay: 0s; }
        .orb-2 { animation-delay: 3s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) translateZ(var(--z, 0)); }
          50% { transform: translateY(-15px) translateZ(var(--z, 0)); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }

        @media (prefers-color-scheme: dark) {
          .glass-card {
            background: rgba(30, 41, 59, 0.6);
            border-color: rgba(148, 163, 184, 0.1);
          }
        }
      `}</style>
        </div>
    );
}

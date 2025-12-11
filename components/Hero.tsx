import React from 'react';
import { ArrowDown, Gift, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  const scrollToOrganizer = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('organizer');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden snow-bg pt-10 pb-20 lg:pt-20 lg:pb-32">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-red-100 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-green-100 rounded-full opacity-50 blur-3xl pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left fade-up">
            <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-red-50 border border-red-100 text-red-600 text-sm font-bold mb-6 shadow-sm hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
              <span>The #1 Secret Santa Generator</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              Organize Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-amber-500 drop-shadow-sm">
                Secret Santa Party
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              The easiest way to organize your holiday gift exchange online. 
              <span className="font-semibold text-gray-800"> Free, fast, and fun</span> for friends, family, and colleagues in India and beyond! 🇮🇳✨
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-8">
              <button
                onClick={scrollToOrganizer}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-red-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 hover:bg-red-700 shadow-xl hover:shadow-red-500/30 transform hover:-translate-y-1"
              >
                <span className="mr-2">Create Your Group</span>
                <Gift className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-amber-400 rounded-full animate-bounce delay-75"></div>
              </button>
              
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({behavior: 'smooth'})}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-gray-700 transition-all duration-200 bg-white border-2 border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
              >
                How it Works
              </button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-3 text-sm text-gray-500 font-medium">
              <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden`}>
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i*13}`} alt="User" />
                    </div>
                 ))}
              </div>
              <p>Join 10,000+ Happy Santas</p>
            </div>
          </div>

          {/* Hero Visual - Specific 3D Santa in Glass Circle */}
          <div className="flex-1 w-full max-w-lg lg:max-w-xl relative flex justify-center fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative z-10 group">
                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-red-400 rounded-full blur-[90px] opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
                
                {/* Glass Circle Wrapper */}
                <div className="relative w-80 h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden border-8 border-white/40 shadow-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm transform transition-transform duration-500 group-hover:scale-105 ring-1 ring-white/50">
                    
                    {/* Glass Shine/Reflection */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/40 via-transparent to-transparent opacity-60 z-20 pointer-events-none rounded-full"></div>
                    
                    {/* Santa Image */}
                    <img 
                        src="https://image.pollinations.ai/prompt/cute%203d%20santa%20claus%20character%20standing%20next%20to%20christmas%20tree%20holding%20a%20gold%20bell%20and%20red%20sack%20high%20quality%20render%20white%20background%20soft%20lighting?width=600&height=600&nologo=true" 
                        alt="Santa Claus with Bell and Sack"
                        className="w-full h-full object-cover relative z-10"
                    />
                </div>
            </div>
            
            {/* Floating Elements around */}
            <div className="absolute top-10 right-0 text-5xl animate-bounce delay-700 drop-shadow-md">🎁</div>
            <div className="absolute bottom-20 left-4 text-5xl animate-wiggle drop-shadow-md">🎄</div>
            <div className="absolute top-1/2 -right-6 text-3xl animate-float delay-1000">✨</div>
          </div>
          
        </div>

        <div className="mt-16 text-gray-400 flex justify-center animate-bounce">
          <ArrowDown className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
};
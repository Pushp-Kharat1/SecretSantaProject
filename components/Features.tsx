import React from 'react';
import { CheckCircle, Gift } from 'lucide-react';

export const Features: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Visuals */}
          <div className="order-2 md:order-1 relative fade-up">
             <div className="bg-red-50 rounded-[3rem] p-10 md:p-14 relative z-10 transform rotate-1 transition-transform hover:rotate-0 duration-500">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#fecaca_1px,transparent_1px)] [background-size:20px_20px] rounded-[3rem] opacity-50"></div>
               
               <div className="space-y-6 relative z-10">
                 <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-red-50 transform -rotate-2 hover:rotate-0 transition-all duration-300">
                   <div className="flex items-start gap-4">
                     <div className="bg-green-100 p-3 rounded-full text-green-600"><Gift size={24} /></div>
                     <div>
                        <p className="font-bold text-gray-800 text-lg">Why Secret Santa Online?</p>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">No more drawing names from a hat. No more "I got myself". We handle the logic so you can handle the fun.</p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-amber-50 transform translate-x-4 rotate-2 hover:rotate-0 transition-all duration-300">
                    <div className="flex items-start gap-4">
                     <div className="bg-amber-100 p-3 rounded-full text-amber-600"><span className="text-xl">🤩</span></div>
                     <div>
                        <p className="font-bold text-gray-800 text-lg">What Makes It Fun?</p>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">Add wishlists, set exclusion rules (couples can't match), and send anonymous messages!</p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
             
             {/* Decorative Elements */}
             <div className="absolute -top-10 -left-10 text-6xl animate-float opacity-80">❄️</div>
             <div className="absolute -bottom-5 -right-5 text-6xl animate-wiggle opacity-80">☃️</div>
          </div>
          
          {/* Right Column: Text */}
          <div className="order-1 md:order-2 fade-up" style={{ animationDelay: '200ms' }}>
            <span className="text-red-600 font-bold tracking-wider uppercase text-sm mb-2 block">Premium Features, Free for Everyone</span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              Modern & Fun <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">Gift Exchange</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Our platform takes the hassle out of the holidays. Whether you're organizing for a remote team, a large family scattered across the globe, or a small group of friends, we make it seamless.
            </p>
            
            <ul className="space-y-4">
              {[
                "100% Free to use forever",
                "Works on Mobile & Desktop",
                "Privacy focused - no spam",
                "No account registration required"
              ].map((item, i) => (
                <li key={i} className="flex items-center text-gray-700 font-medium group">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 group-hover:scale-110 transition-transform" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <button 
                onClick={() => document.getElementById('organizer')?.scrollIntoView({behavior: 'smooth'})}
                className="text-red-600 font-bold border-b-2 border-red-200 hover:border-red-600 hover:text-red-700 transition-colors pb-1"
              >
                Start your party now &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
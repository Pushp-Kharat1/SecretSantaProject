import React, { useState } from 'react';
import { Gift, Menu, X, Snowflake } from 'lucide-react';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-red-50 transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-4">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer group"
            onClick={scrollToSection('home')}
          >
            <div className="relative">
              <Gift className="h-8 w-8 text-red-600 group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 text-green-500 animate-pulse"><Snowflake size={12} /></div>
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 group-hover:text-red-600 transition-colors">
              Secret<span className="text-red-600">Santa</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            {['Home', 'How It Works', 'FAQ'].map((item) => (
              <button 
                key={item}
                onClick={scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))} 
                className="text-gray-600 hover:text-red-600 font-semibold transition-colors bg-transparent border-none cursor-pointer relative group"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
            <button className="text-gray-600 hover:text-red-600 font-semibold transition-colors bg-transparent border-none cursor-pointer relative group">
              Privacy Policy
            </button>
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <select className="border-gray-200 rounded-lg text-sm font-medium text-gray-600 focus:ring-red-500 focus:border-red-500 py-1.5 pl-3 pr-8 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <option>EN 🇺🇸</option>
              <option>IN 🇮🇳</option>
              <option>ES 🇪🇸</option>
            </select>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-red-600 focus:outline-none p-2 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-200 shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <button onClick={scrollToSection('home')} className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all">Home</button>
            <button onClick={scrollToSection('how-it-works')} className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all">How It Works</button>
            <button onClick={scrollToSection('faq')} className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all">FAQ</button>
          </div>
        </div>
      )}
    </header>
  );
};
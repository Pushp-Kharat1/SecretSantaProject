import React from 'react';
import { Gift, Facebook, Twitter, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-16 border-t border-gray-800 relative overflow-hidden">
      {/* Subtle snow effect overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Gift className="h-8 w-8 text-red-500" />
              <span className="font-bold text-2xl tracking-tight">SecretSanta</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Spreading joy one gift at a time. The modern, free way to organize your holiday exchange in India and around the world.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-300"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-300"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-300"><Instagram className="h-5 w-5" /></a>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-6 text-gray-100">Company</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-red-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>About Us</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Contact</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 opacity-0 hover:opacity-100 transition-opacity"></span>Press</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6 text-gray-100">Legal</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-red-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6 text-gray-100">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">Subscribe for holiday tips & tricks!</p>
            <div className="flex">
              <input type="email" placeholder="Your email" className="bg-gray-800 text-white px-4 py-2 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-red-500 w-full text-sm" />
              <button className="bg-red-600 px-4 py-2 rounded-r-lg hover:bg-red-700 transition-colors font-medium">Join</button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-16 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Value Score Business Solutions LLP. Made with ❤️ for the holidays.</p>
        </div>
      </div>
    </footer>
  );
};
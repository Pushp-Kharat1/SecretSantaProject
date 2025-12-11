import React from 'react';
import { Users, FileText, Send, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Users,
      title: "1. Add Participants",
      desc: "Enter names and emails. You can add friends, family, or colleagues easily."
    },
    {
      icon: FileText,
      title: "2. Add Details",
      desc: "Set a budget (₹), date, and write a custom festive message."
    },
    {
      icon: Send,
      title: "3. Send Invites",
      desc: "We match everyone automatically and send out the secret emails! 🤫"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-gray-50 border-t border-gray-200 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 fade-up">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Create Your Party in <span className="text-red-600">3 Easy Steps</span></h2>
          <div className="w-24 h-2 bg-candy-cane mx-auto rounded-full shadow-inner"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-red-100 border-t-2 border-dashed border-red-200 z-0"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative z-10 group fade-up" style={{ animationDelay: `${idx * 200}ms` }}>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col items-center text-center">
                
                <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-red-50">
                  <step.icon className="h-8 w-8 text-red-500" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {step.desc}
                </p>

                {/* Arrow for mobile/tablet */}
                {idx < 2 && (
                  <div className="md:hidden mt-6 text-red-200 animate-bounce">
                    <ArrowRight className="w-6 h-6 rotate-90" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
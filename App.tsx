import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { OrganizerSection } from './components/OrganizerSection';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { RevealPage } from './components/RevealPage';
import { AuthPage } from './components/AuthPage';

const SnowOverlay = () => {
  // Create an array of random snowflakes
  const snowflakes = [...Array(40)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    width: `${Math.random() * 6 + 4}px`,
    height: `${Math.random() * 6 + 4}px`,
    animationDuration: `${Math.random() * 10 + 5}s`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.5 + 0.3
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden h-screen" aria-hidden="true">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute bg-white rounded-full animate-fall shadow-sm"
          style={{
            left: flake.left,
            top: '-20px',
            width: flake.width,
            height: flake.height,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            opacity: flake.opacity,
          }}
        />
      ))}
    </div>
  );
};

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col relative">
      <SnowOverlay />
      <Header />
      <main className="flex-grow">
        <Hero />
        <HowItWorks />
        <OrganizerSection />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/app" element={<Home />} />
        <Route path="/reveal" element={<RevealPage />} />
      </Routes>
    </Router>
  );
}
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Upload, Wand2, Dices, Calendar, MapPin, Coins, Sparkles, Gift, Lock, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Papa from 'papaparse';
import axios from 'axios';

// === TYPES ===
interface Participant {
  id: number;
  name: string;
  email: string;
}

interface Match {
  giver: string;
  giverEmail: string;
  receiver: string;
  theme: 'red' | 'green' | 'golden';
}

// === MATCH PREVIEW CARD COMPONENT ===
const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
  const themeClasses = {
    red: "bg-red-50 border-red-200 text-red-900",
    green: "bg-green-50 border-green-200 text-green-900",
    golden: "bg-amber-50 border-amber-200 text-amber-900",
  };

  const iconColors = {
    red: "text-red-500",
    green: "text-green-500",
    golden: "text-amber-500",
  };

  return (
    <div className={`p-4 rounded-xl border-2 ${themeClasses[match.theme]} flex items-center justify-between shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 hover:scale-[1.02] cursor-default bg-opacity-90 backdrop-blur-sm`}>
      <span className="font-bold">{match.giver}</span>
      <div className={`flex flex-col items-center px-2 ${iconColors[match.theme]}`}>
        <Gift className="w-5 h-5 mb-1" />
        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
      <span className="font-bold">{match.receiver}</span>
    </div>
  );
};

export const OrganizerSection: React.FC = () => {
  // State for Party Details
  const [partyDetails, setPartyDetails] = useState({
    date: '',
    location: '',
    budget: ''
  });

  // State for participants
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, name: '', email: '' },
    { id: 2, name: '', email: '' },
    { id: 3, name: '', email: '' },
  ]);

  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // State for matches
  const [matches, setMatches] = useState<Match[]>([]);
  const [showStatic, setShowStatic] = useState(true);

  // State to track if shuffle has been performed
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  // Password Protection State
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);

  // Email Preview State
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // File Input Ref for CSV Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleDetailChange = (field: string, value: string) => {
    setPartyDetails(prev => ({ ...prev, [field]: value }));
  };

  const addParticipantRow = () => {
    setParticipants([...participants, { id: Date.now(), name: '', email: '' }]);
    setIsShuffled(false); // Reset shuffle state when data changes
  };

  const removeParticipant = (id: number) => {
    if (participants.length > 3) {
      setParticipants(participants.filter(p => p.id !== id));
      setIsShuffled(false); // Reset shuffle state when data changes
    }
  };

  const updateParticipant = (id: number, field: keyof Participant, value: string) => {
    setParticipants(participants.map(p => p.id === id ? { ...p, [field]: value } : p));
    if (field === 'name') {
      setIsShuffled(false); // Reset shuffle state if names change
    }
  };

  // CSV File Upload Handler using PapaParse
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: false, // Parse by index to be flexible
      skipEmptyLines: true,
      complete: (results: any) => {
        const rows = results.data as string[][];
        const newParticipants: Participant[] = [];

        rows.forEach((row, index) => {
          // Basic checks
          if (!row || row.length === 0) return;

          let val0 = (row[0] || '').toString().trim();
          let val1 = (row[1] || '').toString().trim();

          // Attempt to skip header row if it explicitly says "name" or "email" in first row
          if (index === 0) {
            const v0 = val0.toLowerCase();
            const v1 = val1.toLowerCase();
            if (v0 === 'name' || v0 === 'email' || v1 === 'name' || v1 === 'email' || v0 === 'first name') {
              return;
            }
          }

          let name = '';
          let email = '';

          // Intelligent Detection: Check which column looks like an email
          if (val0.includes('@')) {
            email = val0;
            name = val1; // Assume the other column is name
          } else if (val1.includes('@')) {
            email = val1;
            name = val0;
          } else {
            // Default fallback: Column 0 is Name, Column 1 is Email (even if empty or invalid)
            name = val0;
            email = val1;
          }

          // Ensure we have at least one useful piece of info
          if (name || email) {
            newParticipants.push({
              id: Date.now() + Math.random() + index, // Ensure unique ID
              name,
              email
            });
          }
        });

        if (newParticipants.length > 0) {
          setParticipants((prev) => {
            // Filter out the empty default rows if they are untouched and empty
            const validExisting = prev.filter(p => p.name.trim() !== '');
            return [...validExisting, ...newParticipants];
          });
          setIsShuffled(false);
          alert(`Successfully added ${newParticipants.length} participants!`);
        } else {
          alert('No valid participants found. Please upload a CSV with Name and Email.');
        }

        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (err: any) => {
        console.error("CSV Parse Error", err);
        alert("Failed to parse CSV file. Please ensure it is a valid CSV.");
      }
    });
  };

  const handleShuffle = () => {
    // 1. Filter valid participants (must have a name)
    const validParticipants = participants.filter(p => p.name.trim() !== '');

    if (validParticipants.length < 2) {
      alert("You need at least 2 participants with names to shuffle!");
      return;
    }

    setIsRolling(true);

    // 2. DICE SHUFFLER ALGORITHM (Sattolo's Algorithm)
    // This algorithm generates a random cyclic permutation of length N.
    // It guarantees exactly one cycle (no sub-loops) and no fixed points (no self-matches).
    // This is mathematically ideal for Secret Santa.

    // Create an array of indices [0, 1, 2, ... n-1]
    const indices = validParticipants.map((_, i) => i);

    // Perform Sattolo's Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      // Choose j from 0 <= j < i (Strictly less than i)
      // This is the key difference from Fisher-Yates which allows j <= i
      const j = Math.floor(Math.random() * i);

      // Swap
      const temp = indices[i];
      indices[i] = indices[j];
      indices[j] = temp;
    }

    // Map the shuffled indices to create matches
    // participant[i] gives to participant[indices[i]]
    const newMatches: Match[] = validParticipants.map((giver, i) => {
      const receiverIndex = indices[i];
      const receiver = validParticipants[receiverIndex];

      const themes: ('red' | 'green' | 'golden')[] = ['red', 'green', 'golden'];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];

      return {
        giver: giver.name,
        giverEmail: giver.email,
        receiver: receiver.name,
        theme: randomTheme
      };
    });

    // Add a delay for the dice rolling animation
    setTimeout(() => {
      setMatches(newMatches);
      setShowStatic(false);
      setIsShuffled(true);
      setIsRolling(false);
    }, 1500);
  };

  const handleUnlock = () => {
    // Check against the session password set during login
    const validPassword = sessionStorage.getItem('adminPassword');

    if (validPassword && passwordInput === validPassword) {
      setIsUnlocked(true);
      setShowPasswordError(false);
    } else {
      // Fallback or error if no session
      if (!validPassword) {
        alert("Session expired. Please login again.");
        // Optional: redirect to login
        window.location.href = '/';
        return;
      }
      setShowPasswordError(true);
      // Optional: Add shake effect or more feedback here
    }
  };

  const generateMessage = async () => {
    if (!process.env.API_KEY) {
      alert("Please configure the API_KEY environment variable to use AI features.");
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a short, fun, rhyming Secret Santa invitation message (max 50 words). 
                   Details: Budget is ${partyDetails.budget || 'not set'}, 
                   Date is ${partyDetails.date || 'soon'}, 
                   Location is ${partyDetails.location || 'TBD'}.
                   Make it warm and festive!`,
      });
      setMessage(response.text.trim());
    } catch (error) {
      console.error("Error generating message:", error);
      alert("Failed to generate message. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Email HTML string
  const generateEmailHTML = () => {
    const receiverName = participants[0]?.name || "Friend";
    const budget = partyDetails.budget || "₹ 500";
    const date = partyDetails.date || "December 25th";
    const location = partyDetails.location || "North Pole";
    const organizerMsg = message || "Ho Ho Ho! Join us for a magical Secret Santa exchange.";

    return `
<div style="font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333333; line-height: 1.6; text-align: left;">
  <p style="margin: 0 0 16px 0;">Hi ${receiverName},</p>
  
  <p style="margin: 0 0 16px 0;">You've been invited to the Secret Santa party!</p>
  
  <p style="margin: 0 0 16px 0;">Here are the details:</p>
  
  <p style="margin: 0 0 8px 0;">
    <strong>Budget:</strong> ${budget}<br>
    <strong>Date:</strong> ${date}<br>
    <strong>Location:</strong> ${location}
  </p>
  
  <p style="margin: 0 0 16px 0;"><strong>Message from Organizer:</strong></p>
  
  <p style="margin: 0 0 24px 0;">${organizerMsg}</p>
  
  <a href="#" style="display: block; width: 100%; background-color: #ef4444; color: #0000FF; text-decoration: none; text-align: center; padding: 16px 0; font-weight: bold; border-radius: 4px; font-size: 16px;">Find out your person</a>
</div>`;
  };

  const sendEmails = async () => {
    // 1. Validation
    // Filter valid participants
    const validParticipants = participants.filter(p => p.name.trim() !== '' && p.email.trim() !== '');

    if (validParticipants.length < 2) {
      alert("You need at least 2 participants with names and emails!");
      return;
    }

    const confirmSend = window.confirm(`Are you sure you want to send emails to ${validParticipants.length} participants?`);
    if (!confirmSend) return;

    // 2. Call Backend
    try {
      // Show loading indicator usually, but for now simple alert
      console.log("Sending request to backend...");

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const organizerEmail = user.email;

      const response = await axios.post('/api/event', {
        details: partyDetails,
        participants: validParticipants,
        organizerEmail
      });

      console.log("Backend response:", response.data);
      alert(`Success! Invitations have been sent to ${response.data.emailsSent} participants.`);
      setShowEmailPreview(false);

    } catch (error: any) {
      console.error("Failed to crate event:", error);
      alert("Failed to send invitations. Please check the console for details.");
    }
  };

  // Static matches for the Preview Section (Initial State)
  const staticMatches: Match[] = [
    { giver: "Arjun", giverEmail: "test@example.com", receiver: "Priya", theme: "red" },
    { giver: "Neha", giverEmail: "test@example.com", receiver: "Rahul", theme: "green" },
    { giver: "Vikram", giverEmail: "test@example.com", receiver: "Sara", theme: "golden" },
  ];

  // Determine if we need to enable scrolling for participants
  const isScrollableList = participants.length > 10;

  return (
    <section id="organizer" className="py-20 relative bg-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-4 bg-candy-cane opacity-50"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* LEFT COLUMN: PARTICIPANTS */}
          <div>
            <div className="flex items-center mb-8">
              <div className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg mr-4 transform hover:rotate-12 transition-transform">1</div>
              <h2 className="text-3xl font-bold text-gray-900">Add your participants</h2>
            </div>

            {/* PARTY DETAILS FORM */}
            <div className="bg-white p-6 rounded-2xl border border-red-100 mb-8 animate-in fade-in slide-in-from-left-4 duration-700 shadow-xl shadow-red-50 relative overflow-hidden">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px]"></div>

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-5">

                {/* Date Input */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-red-500 transition-colors">Date</label>
                  <div className="relative transform transition-all duration-300 focus-within:scale-105">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                    </div>
                    <input
                      type="date"
                      value={partyDetails.date}
                      onChange={(e) => handleDetailChange('date', e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm shadow-sm bg-gray-50/50"
                    />
                  </div>
                </div>

                {/* Location Input */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-red-500 transition-colors">Location</label>
                  <div className="relative transform transition-all duration-300 focus-within:scale-105">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Office / Home"
                      value={partyDetails.location}
                      onChange={(e) => handleDetailChange('location', e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm shadow-sm bg-gray-50/50"
                    />
                  </div>
                </div>

                {/* Budget Input - INR */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 group-focus-within:text-red-500 transition-colors">Budget</label>
                  <div className="relative transform transition-all duration-300 focus-within:scale-105">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Coins className="h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. ₹ 500"
                      value={partyDetails.budget}
                      onChange={(e) => handleDetailChange('budget', e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm shadow-sm bg-gray-50/50"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* PARTICIPANT LIST */}
            <div className={`space-y-4 transition-all duration-300 ${isScrollableList ? 'h-[400px] overflow-y-auto pr-2 border border-gray-200 rounded-2xl p-4 custom-scrollbar shadow-inner bg-gray-50/50' : ''}`}>
              {participants.map((p, index) => (
                <div key={p.id} className="group flex gap-4 p-4 bg-white border-b border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 items-center" style={{ animationDelay: `${(index % 10) * 50}ms` }}>
                  <div className="bg-gray-100 text-gray-400 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold group-hover:bg-red-100 group-hover:text-red-500 transition-colors flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full border-none bg-transparent focus:ring-0 text-gray-800 placeholder-gray-400 font-medium"
                      placeholder="Name"
                      value={p.name}
                      onChange={(e) => updateParticipant(p.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="email"
                      className="w-full border-none bg-transparent focus:ring-0 text-gray-600 placeholder-gray-300 text-sm"
                      placeholder="Email Address"
                      value={p.email}
                      onChange={(e) => updateParticipant(p.id, 'email', e.target.value)}
                    />
                  </div>
                  {participants.length > 3 && (
                    <button
                      onClick={() => removeParticipant(p.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex-shrink-0"
                      title="Remove participant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={addParticipantRow}
                className="flex items-center px-6 py-3 border-2 border-gray-100 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:border-green-400 hover:text-green-600 transition-all transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5 mr-2" /> Add Person
              </button>

              <button
                onClick={handleShuffle}
                disabled={isShuffled || isRolling}
                className={`flex items-center px-6 py-3 border border-transparent shadow-md text-sm font-bold rounded-xl text-white transition-all transform hover:-translate-y-0.5 ${isShuffled
                  ? 'bg-indigo-300 cursor-not-allowed shadow-none transform-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30'
                  }`}
              >
                <Dices className={`w-5 h-5 mr-2 ${isRolling ? 'animate-spin' : isShuffled ? '' : 'animate-pulse'}`} />
                {isRolling ? 'Rolling...' : isShuffled ? 'Pairs Shuffled!' : 'Shuffle Pairs'}
              </button>

              {/* CSV Upload Section */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.txt"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-6 py-3 border border-dashed border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all ml-auto"
              >
                <Upload className="w-4 h-4 mr-2" /> Bulk CSV
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW & MESSAGE */}
          <div className="space-y-12">

            {/* MATCH PREVIEW SECTION */}
            <div className="bg-gradient-to-br from-red-50 to-white p-8 rounded-3xl border border-red-100 shadow-xl min-h-[450px] relative overflow-hidden flex flex-col">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 rounded-bl-full -z-0"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-100/50 rounded-tr-full -z-0"></div>

              {/* Decorative Element CSS (Replaces GIF) */}
              <div className="absolute -bottom-8 -right-8 w-48 h-48 opacity-10 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 text-6xl animate-bounce">🎁</div>
              </div>

              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Gift className="text-red-500 w-5 h-5" />
                    <span>Match Preview</span>
                  </h2>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide transition-colors duration-500 ${!isUnlocked ? 'bg-gray-100 text-gray-400' : (showStatic ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700 border border-green-200')}`}>
                    {!isUnlocked ? 'Locked' : (showStatic ? 'Example Mode' : 'Live Preview')}
                  </span>
                </div>

                {!isUnlocked ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in fade-in duration-500">
                    <div className="bg-red-100 p-5 rounded-full text-red-500 mb-2 shadow-inner">
                      <Lock className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Admin Access Required</h3>
                      <p className="text-sm text-gray-500 px-4 mt-1">Enter the admin password to view the matches.</p>
                    </div>

                    <div className="w-full max-w-xs space-y-3 pt-2">
                      <div className="relative">
                        <input
                          type="password"
                          placeholder="Enter Password"
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-all shadow-sm ${showPasswordError ? 'border-red-500 ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-red-200 focus:border-red-300'}`}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                        />
                        {showPasswordError && (
                          <div className="absolute -bottom-5 left-0 w-full text-center">
                            <span className="text-xs text-red-500 font-bold animate-pulse">Incorrect password</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleUnlock}
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-red-500/30 active:scale-95"
                      >
                        Unlock Preview
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {isRolling ? (
                      <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in">
                        <Dices className="w-24 h-24 text-red-600 animate-bounce" />
                        <p className="mt-6 text-xl font-bold text-gray-600 animate-pulse">Rolling the dice...</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar animate-in fade-in zoom-in duration-300">
                        {(showStatic ? staticMatches : matches).map((match, i) => (
                          <MatchCard key={i} match={match} />
                        ))}
                      </div>
                    )}

                    {showStatic && !isRolling && (
                      <div className="mt-8 p-4 bg-amber-50/80 backdrop-blur-sm rounded-xl border border-amber-200 text-amber-900 text-sm flex items-start gap-3 shadow-sm">
                        <div className="bg-amber-100 rounded-full p-1 mt-0.5"><Sparkles className="w-3 h-3 text-amber-600" /></div>
                        <p>Add your participants on the left, then click <strong>"Shuffle Pairs"</strong> to let the magic happen!</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* MESSAGE SECTION */}
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg mr-4 transform hover:rotate-12 transition-transform">2</div>
                <h2 className="text-3xl font-bold text-gray-900">Add a personal message</h2>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-300 via-purple-300 to-indigo-300 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                <textarea
                  rows={5}
                  className="relative block w-full rounded-2xl border-gray-200 shadow-inner focus:border-red-500 focus:ring-red-500 sm:text-sm p-6 bg-white resize-y font-medium text-gray-600"
                  placeholder="Ho Ho Ho! 🎅 Welcome to our Secret Santa party! Please bring a gift worth ₹500..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button
                  onClick={generateMessage}
                  disabled={isGenerating}
                  className="absolute bottom-4 right-4 inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold uppercase tracking-wider rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg disabled:opacity-50 transition-all transform hover:-translate-y-0.5 z-10"
                >
                  <Wand2 className={`w-3 h-3 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Writing...' : 'AI Magic'}
                </button>
              </div>
            </div>

            {/* FINAL ACTION */}
            <div className="pt-2">
              <button
                onClick={() => setShowEmailPreview(true)}
                className="w-full flex items-center justify-center px-8 py-5 border border-transparent text-2xl font-bold rounded-2xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl hover:shadow-green-500/40 transition-all transform hover:-translate-y-1 hover:scale-[1.01]"
              >
                Send Invitations 🚀
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* EMAIL PREVIEW MODAL */}
      {showEmailPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-300 border border-gray-100">
            <div className="sticky top-0 bg-white/95 backdrop-blur z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Invitation Preview</h3>
              <button onClick={() => setShowEmailPreview(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 bg-gray-50 flex justify-center">
              <div
                className="bg-white shadow-sm border border-gray-200 w-full max-w-[600px]"
                dangerouslySetInnerHTML={{ __html: generateEmailHTML() }}
              />
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowEmailPreview(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendEmails}
                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg hover:shadow-green-500/30 transition-all"
              >
                Send Real Emails 🚀
              </button>
            </div>

            <div className="bg-white border-t border-gray-100 p-6 flex items-center justify-between text-sm text-gray-500">
              <p>
                Emails are sent securely via the backend server.
              </p>
              <div className="flex items-center text-green-600 gap-1 font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Backend Connected
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
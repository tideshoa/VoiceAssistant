import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-8">
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
        Tides Community Voice
      </h1>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        Your resident assistant for HOA rules, schedules, and community guidelines.
      </p>
    </header>
  );
};

export default Header;
import React from 'react';
import { Settings, HelpCircle, Search, PenTool, ArrowLeftRight, Eye, Award } from 'lucide-react';

const APP_ICON = "https://customer-assets.emergentagent.com/job_magyar-abc/artifacts/qdv3plil_image.png";

const MainMenu = ({ onOpenSettings, onOpenStickerBook, onStartMode, child }) => {
  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-start p-6 space-y-6 font-body text-darkText">
      <div className="flex flex-col items-center mt-4">
        <img src={APP_ICON} alt="Betűkereső logó" className="w-24 h-24 rounded-2xl shadow" />
        <h1 className="font-display text-4xl text-pastelBlue mt-2">Betűkereső</h1>
        {child && (
          <p className="text-lightText mt-1">Üdv, {child.name}!</p>
        )}
      </div>

      <div className="w-full max-w-xs space-y-4 mt-6">
        <button onClick={() => onStartMode('find-letter')} className="w-full bg-pastelBlue text-white text-lg font-semibold py-3 rounded-2xl shadow hover:bg-[#6b9ec8] transition flex items-center justify-center gap-2">
          <Search className="w-5 h-5" /> Keresd (betű felismerés)
        </button>
        <button onClick={() => onStartMode('trace-letter')} className="w-full bg-pastelPink text-white text-lg font-semibold py-3 rounded-2xl shadow hover:bg-[#f29fb0] transition flex items-center justify-center gap-2">
          <PenTool className="w-5 h-5" /> Rajzold (betű rajzolás)
        </button>
        <button onClick={() => onStartMode('match-case')} className="w-full bg-pastelBlue text-white text-lg font-semibold py-3 rounded-2xl shadow hover:bg-[#6b9ec8] transition flex items-center justify-center gap-2">
          <ArrowLeftRight className="w-5 h-5" /> Párosítsd (kis/nagy)
        </button>
        <button onClick={() => onStartMode('show-mark')} className="w-full bg-cloudGray text-darkText text-lg font-semibold py-3 rounded-2xl shadow hover:bg-slate-300 transition flex items-center justify-center gap-2">
          <Eye className="w-5 h-5" /> Mutasd & Jelöld (tanár)
        </button>
        <button onClick={onOpenStickerBook} className="w-full bg-pastelPink text-white text-lg font-semibold py-3 rounded-2xl shadow hover:bg-[#f29fb0] transition flex items-center justify-center gap-2">
          <Award className="w-5 h-5" /> Matrica gyűjtemény
        </button>
      </div>

      <div className="flex justify-between w-full max-w-xs pt-6">
        <button onClick={onOpenSettings} className="bg-cloudGray p-3 rounded-full hover:bg-slate-300 transition" aria-label="Beállítások">
          <Settings className="w-5 h-5 text-darkText" />
        </button>
        <button className="bg-cloudGray p-3 rounded-full hover:bg-slate-300 transition" aria-label="Súgó">
          <HelpCircle className="w-5 h-5 text-darkText" />
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
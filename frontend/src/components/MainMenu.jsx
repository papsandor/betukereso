import React, { useState } from 'react';
import { Settings, HelpCircle, Search, PenTool, ArrowLeftRight, Eye, Award } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

const APP_ICON = "https://customer-assets.emergentagent.com/job_magyar-abc/artifacts/qdv3plil_image.png";

const MainMenu = ({ onOpenSettings, onOpenStickerBook, onStartMode, child }) => {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 space-y-6 font-body text-darkText">
      <div className="flex flex-col items-center mt-4 bg-semi-transparent p-6 rounded-2xl backdrop-blur-sm">
        <img src={APP_ICON} alt="Betűkereső logó" className="w-24 h-24 rounded-2xl shadow" />
        <h1 className="font-display text-4xl text-pastelBlue mt-2">Betűkereső</h1>
        {child && (
          <p className="text-lightText mt-1">Üdv, {child.name}!</p>
        )}
      </div>

      <div className="w-full max-w-xs space-y-4 mt-6">
        <button onClick={() => onStartMode('find-letter')} className="w-full bg-button-semi backdrop-blur-sm text-white text-lg font-semibold py-3 rounded-2xl shadow hover:bg-[#6b9ec8] transition flex items-center justify-center gap-2">
          <Search className="w-5 h-5" /> Keresd (betű felismerés)
        </button>
        <button onClick={() => onStartMode('trace-letter')} className="w-full bg-button-pink-semi backdrop-blur-sm text-white text-lg font-semibold py-3 rounded-2xl shadow hover:bg-[#f29fb0] transition flex items-center justify-center gap-2">
          <PenTool className="w-5 h-5" /> Rajzold (betű rajzolás)
        </button>
        <button onClick={() => onStartMode('match-case')} className="w-full bg-button-semi backdrop-blur-sm text-white text-lg font-semibold py-3 rounded-2xl shadow hover:bg-[#6b9ec8] transition flex items-center justify-center gap-2">
          <ArrowLeftRight className="w-5 h-5" /> Párosítsd (kis/nagy)
        </button>
        <button onClick={() => onStartMode('show-mark')} className="w-full bg-button-gray-semi backdrop-blur-sm text-darkText text-lg font-semibold py-3 rounded-2xl shadow hover:bg-slate-300 transition flex items-center justify-center gap-2">
          <Eye className="w-5 h-5" /> Mutasd & Jelöld (tanár)
        </button>
        <button onClick={onOpenStickerBook} className="w-full bg-button-pink-semi backdrop-blur-sm text-white text-lg font-semibold py-3 rounded-2xl shadow hover:bg-[#f29fb0] transition flex items-center justify-center gap-2">
          <Award className="w-5 h-5" /> Matrica gyűjtemény
        </button>
      </div>

      <div className="flex justify-between w-full max-w-xs pt-6">
        <button onClick={onOpenSettings} className="bg-opaque p-3 rounded-full hover:bg-slate-300 transition" aria-label="Beállítások">
          <Settings className="w-5 h-5 text-darkText" />
        </button>
        <button onClick={() => setHelpOpen(true)} className="bg-opaque p-3 rounded-full hover:bg-slate-300 transition" aria-label="Súgó">
          <HelpCircle className="w-5 h-5 text-darkText" />
        </button>
      </div>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-lg bg-opaque">
          <DialogHeader>
            <DialogTitle>Információk</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-darkText">
            <p className="text-center font-display text-xl">Nagyhercegnőmnek, Annának! ❤️</p>
            <p className="text-center">Betűkereső v.1.0</p>
            <p className="text-center">Készítette: dr. Pap Sándor</p>
            <p className="text-sm text-center text-lightText">
              Az alkalmazás, annak teljes tartalma, valamint minden kapcsolódó szellemi alkotás a tulajdonos kizárólagos jogát képezi. A tulajdonos minden, az alkalmazással és annak tartalmával kapcsolatos jogot fenntart.
            </p>
            <div className="text-center">
              <button onClick={() => setHelpOpen(false)} className="bg-pastelBlue text-white px-4 py-2 rounded-2xl shadow hover:bg-[#6b9ec8] transition">Bezár</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainMenu;
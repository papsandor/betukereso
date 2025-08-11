import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Trash2, Plus, UserCheck, Star, Award } from 'lucide-react';
import { mockChildren } from '../data/mock';

const ChildSelector = ({ onChildSelect, currentChild }) => {
  const [children, setChildren] = useState(mockChildren);
  const [newChildName, setNewChildName] = useState('');
  const [isAddingChild, setIsAddingChild] = useState(false);

  const handleAddChild = () => {
    if (!newChildName.trim()) return;
    
    const newChild = {
      id: Date.now().toString(),
      name: newChildName.trim(),
      streak: 0,
      totalStickers: 0,
      progress: {},
      createdAt: new Date().toISOString()
    };
    
    setChildren([...children, newChild]);
    setNewChildName('');
    setIsAddingChild(false);
    onChildSelect(newChild);
  };

  const handleDeleteChild = (childId) => {
    setChildren(children.filter(c => c.id !== childId));
    if (currentChild && currentChild.id === childId) {
      onChildSelect(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Betűkereső</h1>
        <p className="text-lg text-gray-600">Válaszd ki a gyereket, vagy adj hozzá újat!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {children.map((child) => (
          <Card 
            key={child.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              currentChild?.id === child.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => onChildSelect(child)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <span className="text-xl">{child.name}</span>
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChild(child.id);
                  }}
                  className="bg-red-100 hover:bg-red-200 text-red-700 border-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {child.streak} sorozat
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {child.totalStickers} matrica
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Tanult betűk: {Object.keys(child.progress).length}
              </div>
              <div className="text-xs text-gray-500">
                Csatlakozva: {new Date(child.createdAt).toLocaleDateString('hu-HU')}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Child Card */}
        <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
          <Dialog open={isAddingChild} onOpenChange={setIsAddingChild}>
            <DialogTrigger asChild>
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <Plus className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-600">Új gyerek hozzáadása</p>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Új gyerek hozzáadása</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Gyerek neve..."
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddChild()}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0" onClick={() => setIsAddingChild(false)}>
                    Mégse
                  </Button>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white border-0" onClick={handleAddChild} disabled={!newChildName.trim()}>
                    Hozzáadás
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </div>
  );
};

export default ChildSelector;
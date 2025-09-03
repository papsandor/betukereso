import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Trash2, Plus, UserCheck, Star, Award, Loader2 } from 'lucide-react';
import ApiService from '../services/ApiService';

const APP_ICON = "https://customer-assets.emergentagent.com/job_magyar-abc/artifacts/qdv3plil_image.png";

const ChildSelector = ({ onChildSelect, currentChild }) => {
  const [children, setChildren] = useState([]);
  const [newChildName, setNewChildName] = useState('');
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      const childrenData = await ApiService.getChildren();
      setChildren(childrenData);
    } catch (err) {
      setError('Failed to load children');
      console.error('Error loading children:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!newChildName.trim()) return;
    try {
      const newChild = await ApiService.createChild(newChildName.trim());
      setChildren([...children, newChild]);
      setNewChildName('');
      setIsAddingChild(false);
      onChildSelect(newChild);
    } catch (err) {
      setError('Failed to create child');
      console.error('Error creating child:', err);
    }
  };

  const handleDeleteChild = async (childId) => {
    try {
      await ApiService.deleteChild(childId);
      setChildren(children.filter(c => c.id !== childId));
      if (currentChild && currentChild.id === childId) {
        onChildSelect(null);
      }
    } catch (err) {
      setError('Failed to delete child');
      console.error('Error deleting child:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading children...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
          {error}
        </div>
        <Button onClick={loadChildren} className="bg-primary text-primary-foreground hover:bg-primary/90 border-0">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8 bg-semi-transparent p-6 rounded-2xl">
        <img src={APP_ICON} alt="Betűkereső ikon" className="mx-auto mb-3 w-16 h-16 rounded-2xl shadow" />
        <h1 className="text-4xl font-extrabold text-foreground mb-2 font-brand-heading">Betűkereső</h1>
        <p className="text-lg text-gray-600">Válaszd ki a gyereket, vagy adj hozzá újat!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {children.map((child) => (
          <Card 
            key={child.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-card-semi backdrop-blur-sm ${
              currentChild?.id === child.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onChildSelect(child)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <span className="text-xl">{child.name}</span>
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChild(child.id);
                  }}
                  className="bg-semi-transparent hover:bg-destructive/20 text-destructive border-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1 bg-semi-transparent">
                  <Star className="h-3 w-3" />
                  {child.streak} sorozat
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 bg-semi-transparent">
                  <Award className="h-3 w-3" />
                  {child.total_stickers} matrica
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Tanult betűk: {Object.keys(child.progress || {}).length}
              </div>
              <div className="text-xs text-gray-500">
                Csatlakozva: {new Date(child.created_at).toLocaleDateString('hu-HU')}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Child Card */}
        <Card className="border-dashed border-2 border-gray-300 hover:border-primary transition-colors cursor-pointer bg-card-semi backdrop-blur-sm">
          <Dialog open={isAddingChild} onOpenChange={setIsAddingChild}>
            <DialogTrigger asChild>
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <Plus className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-600">Új gyerek hozzáadása</p>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-opaque">
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
                  className="bg-opaque"
                />
                <div className="flex gap-2 justify-end">
                  <Button className="bg-muted hover:bg-accent text-foreground border-0" onClick={() => setIsAddingChild(false)}>
                    Mégse
                  </Button>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 border-0" onClick={handleAddChild} disabled={!newChildName.trim()}>
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
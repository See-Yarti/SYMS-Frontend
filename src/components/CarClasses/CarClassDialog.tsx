// src/components/CarClasses/CarClassDialog.tsx
import * as React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const VEHICLE_SIZES = [
  { code: 'M', name: 'Mini' }, { code: 'E', name: 'Economy' }, { code: 'C', name: 'Compact' },
  { code: 'I', name: 'Intermediate' }, { code: 'S', name: 'Standard' }, { code: 'F', name: 'Full-size' },
  { code: 'P', name: 'Premium' }, { code: 'L', name: 'Luxury' }, { code: 'X', name: 'Special' },
];
const BODY_TYPES = [
  { code: 'C', name: 'Sedan/Hatchback' }, { code: 'R', name: 'SUV' }, { code: 'V', name: 'Van/MPV' },
  { code: 'W', name: 'Wagon' }, { code: 'T', name: 'Convertible' }, { code: 'P', name: 'Pickup Truck' }, { code: 'E', name: 'Electric' },
];
const TRANSMISSION_TYPES = [
  { code: 'A', name: 'Automatic' }, { code: 'M', name: 'Manual' }, { code: 'B', name: 'AWD/Auto' }, { code: 'D', name: '4WD/Manual' },
];
const FUEL_TYPES = [
  { code: 'R', name: 'Petrol+AC' }, { code: 'N', name: 'Petrol' }, { code: 'D', name: 'Diesel' },
  { code: 'E', name: 'Electric' }, { code: 'H', name: 'Hybrid' }, { code: 'L', name: 'CNG/LPG' },
];

export default function CarClassDialog({
  open,
  onClose,
  onSave,
  editing,
  allCarClasses = [],
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (carClass: any) => void;
  editing: any | null;
  onDelete?: () => void;
  allCarClasses?: any[];
}) {
  const [carClassCode, setCarClassCode] = React.useState(editing?.carClass?.name ?? editing?.code ?? '');
  const [size, setSize] = React.useState<string>('');
  const [body, setBody] = React.useState<string>('');
  const [transmission, setTransmission] = React.useState<string>('');
  const [fuel, setFuel] = React.useState<string>('');

  const [make, setMake] = React.useState(editing?.make ?? '');
  const [model, setModel] = React.useState(editing?.model ?? '');
  const [description, setDescription] = React.useState(editing?.description ?? '');
  const [numberOfDoors, setNumberOfDoors] = React.useState(editing?.numberOfDoors ?? 4);
  const [numberOfPassengers, setNumberOfPassengers] = React.useState(editing?.numberOfPassengers ?? 5);
  const [numberOfBags, setNumberOfBags] = React.useState(editing?.numberOfBags ?? 2);

  
  // Image upload state
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(editing?.imageUrl || null);

  React.useEffect(() => {
    if (carClassCode && carClassCode.length === 4) {
      setSize(carClassCode[0]);
      setBody(carClassCode[1]);
      setTransmission(carClassCode[2]);
      setFuel(carClassCode[3]);
    } else {
      setSize('');
      setBody('');
      setTransmission('');
      setFuel('');
    }
  }, [carClassCode]);

  React.useEffect(() => {
    setCarClassCode(editing?.carClass?.name ?? editing?.code ?? '');
    setMake(editing?.make ?? '');
    setModel(editing?.model ?? '');
    setDescription(editing?.description ?? '');
    setNumberOfDoors(editing?.numberOfDoors ?? 4);
    setNumberOfPassengers(editing?.numberOfPassengers ?? 5);
    setNumberOfBags(editing?.numberOfBags ?? 2);

    // Reset image state
    setSelectedImage(null);
    setImagePreview(editing?.images && editing.images.length > 0 ? editing.images[0].url : null);

    if (editing?.carClass?.name) {
      setSize(editing.carClass.name[0]);
      setBody(editing.carClass.name[1]);
      setTransmission(editing.carClass.name[2]);
      setFuel(editing.carClass.name[3]);
    }
  }, [editing, open]);

  function labelForACRISS(code: string, arr: { code: string; name: string }[]) {
    return arr.find(opt => opt.code === code)?.name || '';
  }

  // Image upload handlers
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      carClassId: allCarClasses.find(c => c.name === carClassCode)?.id || editing?.carClass?.id || '',
      make,
      model,
      description,
      numberOfDoors: Number(numberOfDoors),
      numberOfPassengers: Number(numberOfPassengers),
      numberOfBags: Number(numberOfBags),
      image: selectedImage,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl shadow-xl border border-border bg-card text-card-foreground px-8 py-6">
        <DialogHeader>
          <div className="flex justify-between items-center mb-2">
            <DialogTitle className="text-2xl font-bold">{editing ? 'Update' : 'Add'} Car Class</DialogTitle>
          </div>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1">Car Class Code *</Label>
              <Select
                value={carClassCode}
                onValueChange={setCarClassCode}
              >
                <SelectTrigger className="w-full bg-background border border-input rounded-md focus:ring-2 focus:ring-[#F56304]">
                  <SelectValue placeholder="Select Car Class Code" />
                </SelectTrigger>
                <SelectContent>
                  {allCarClasses.map((cc) => (
                    <SelectItem key={cc.id} value={cc.name}>
                      <span className="font-mono font-bold">{cc.name}</span>
                      {cc.description ? <span className="ml-2 text-xs text-muted-foreground">{cc.description}</span> : null}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1">Make *</Label>
              <Input className="w-full bg-background border border-input rounded-md" value={make} onChange={e => setMake(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1">Model *</Label>
              <Input className="w-full bg-background border border-input rounded-md" value={model} onChange={e => setModel(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1">Description</Label>
              <Input className="w-full bg-background border border-input rounded-md" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Car Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Car preview" 
                    className="w-24 h-24 object-cover rounded-lg border border-input"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed border-input rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Max size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted px-3 py-3 rounded-xl border border-muted">
            <div>
              <Label className="mb-1">Vehicle Size *</Label>
              <Input value={size ? `${size} - ${labelForACRISS(size, VEHICLE_SIZES)}` : ''} readOnly tabIndex={-1}
                className="w-full bg-muted text-muted-foreground border border-input rounded-md cursor-not-allowed" />
            </div>
            <div>
              <Label className="mb-1">Body Type *</Label>
              <Input value={body ? `${body} - ${labelForACRISS(body, BODY_TYPES)}` : ''} readOnly tabIndex={-1}
                className="w-full bg-muted text-muted-foreground border border-input rounded-md cursor-not-allowed" />
            </div>
            <div>
              <Label className="mb-1">Transmission *</Label>
              <Input value={transmission ? `${transmission} - ${labelForACRISS(transmission, TRANSMISSION_TYPES)}` : ''} readOnly tabIndex={-1}
                className="w-full bg-muted text-muted-foreground border border-input rounded-md cursor-not-allowed" />
            </div>
            <div>
              <Label className="mb-1">Fuel Type *</Label>
              <Input value={fuel ? `${fuel} - ${labelForACRISS(fuel, FUEL_TYPES)}` : ''} readOnly tabIndex={-1}
                className="w-full bg-muted text-muted-foreground border border-input rounded-md cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-1">Doors *</Label>
              <Input
                type="number"
                min={2}
                className="w-full bg-background border border-input rounded-md"
                value={numberOfDoors}
                onChange={e => setNumberOfDoors(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label className="mb-1">Passengers *</Label>
              <Input
                type="number"
                min={1}
                className="w-full bg-background border border-input rounded-md"
                value={numberOfPassengers}
                onChange={e => setNumberOfPassengers(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label className="mb-1">Baggage *</Label>
              <Input
                type="number"
                min={0}
                className="w-full bg-background border border-input rounded-md"
                value={numberOfBags}
                onChange={e => setNumberOfBags(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-8 gap-3 flex-row justify-end">
            {editing && onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete} className="mr-auto">
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} className="font-semibold">
              Cancel
            </Button>
            <Button type="submit" className="font-semibold bg-[#F56304] hover:bg-[#e05503] text-white">
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
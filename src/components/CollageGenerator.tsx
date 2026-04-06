import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Download, X, Palette, Type, Image as ImageIcon, CheckCircle2, Trash2, Plus, ImagePlus, GripVertical, RotateCw, Pencil } from "lucide-react";
import clsx from "clsx";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ImageInfo {
  file: File;
  url: string;
  width: number;
  height: number;
  displayName: string;
  rotation: number;
}

interface GridSlot {
  id: string;
  image: ImageInfo | null;
}

function SortableSlot({ 
  slot, 
  onDragOver, 
  onDropToSlot, 
  handleSlotUpload, 
  setBgImage, 
  clearSlotImage, 
  removeSlot, 
  showImageNames, 
  isDarkBg, 
  slotInputRefs,
  onRenameSlot,
  onRotateSlot
}: { 
  slot: GridSlot; 
  onDragOver: any; 
  onDropToSlot: any; 
  handleSlotUpload: any; 
  setBgImage: any; 
  clearSlotImage: any; 
  removeSlot: any; 
  showImageNames: boolean; 
  isDarkBg: boolean; 
  slotInputRefs: any;
  onRenameSlot: (id: string, name: string) => void;
  onRotateSlot: (id: string) => void;
  key?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
    touchAction: 'none',
  };

  const cleanName = slot.image ? slot.image.displayName : "";
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(slot.image?.displayName || "");

  useEffect(() => {
    setNewName(slot.image?.displayName || "");
  }, [slot.image?.displayName]);

  const handleRenameSubmit = () => {
    onRenameSlot(slot.id, newName.toUpperCase());
    setIsRenaming(false);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        "relative group rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-200 cursor-grab active:cursor-grabbing",
        slot.image 
          ? "border-white/10 bg-black/40 shadow-xl" 
          : "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 min-h-[120px]"
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDropToSlot(e, slot.id)}
    >
      <input
        type="file"
        ref={(el) => (slotInputRefs.current[slot.id] = el)}
        onChange={(e) => e.target.files?.[0] && handleSlotUpload(slot.id, e.target.files[0])}
        accept="image/*"
        className="hidden"
      />
      
      {slot.image ? (
        <div className="w-full h-full relative">
          <img 
            src={slot.image.url} 
            className="w-full h-full object-contain pointer-events-none select-none" 
            alt={slot.image.file.name} 
            style={{
              aspectRatio: slot.image.rotation % 180 === 0 
                ? `${slot.image.width} / ${slot.image.height}` 
                : `${slot.image.height} / ${slot.image.width}`,
              transform: `rotate(${slot.image.rotation}deg)`,
              transition: 'transform 0.3s ease-in-out, aspect-ratio 0.3s ease-in-out'
            }}
          />
          {showImageNames && (
            <div 
              className={clsx(
                "absolute bottom-3 left-3 px-3 py-1.5 backdrop-blur-md rounded-lg text-sm font-bold uppercase tracking-widest border border-white/10 pointer-events-auto cursor-pointer flex items-center gap-2 z-20",
                isDarkBg ? "bg-black/60 text-white" : "bg-white/80 text-black"
              )}
            >
              {isRenaming ? (
                <input 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === ' ') e.stopPropagation();
                  }}
                  className={clsx("bg-transparent w-full outline-none", isDarkBg ? "text-white" : "text-black")}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span onDoubleClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}>{cleanName}</span>
                  <Pencil className="w-3 h-3 cursor-pointer hover:text-emerald-500" onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} />
                </>
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button 
              title="Rotate 90°"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRotateSlot(slot.id); }}
              className="p-2 bg-blue-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); clearSlotImage(slot.id); }} 
              className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4"
          onClick={() => slotInputRefs.current[slot.id]?.click()}
        >
          <Upload className="w-6 h-6 text-neutral-600 mb-2 group-hover:text-emerald-500 transition-colors pointer-events-none" />
          <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest group-hover:text-neutral-400 transition-colors pointer-events-none">
            Upload
          </span>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); removeSlot(slot.id); }}
            className="absolute top-2 right-2 p-1 text-neutral-700 hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function CollageGenerator() {
  const [slots, setSlots] = useState<GridSlot[]>([
    { id: "1", image: null },
    { id: "2", image: null },
    { id: "3", image: null },
  ]);
  const [background, setBackground] = useState<"gray-black" | "brown-black" | "white">("gray-black");
  const [bgImage, setBgImage] = useState<ImageInfo | null>(null);
  const [logo, setLogo] = useState<{ file: File; url: string } | null>(null);
  const [showImageNames, setShowImageNames] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const slotInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const emptySlot = slots.find(s => !s.image);
            const slotId = emptySlot ? emptySlot.id : Math.random().toString(36).substr(2, 9);
            if (!emptySlot) {
              setSlots(prev => [...prev, { id: slotId, image: null }]);
            }
            handleSlotUpload(slotId, file, "Pasted Image");
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [slots]);

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setBgImage({ file, url, width: img.width, height: img.height });
      };
      img.src = url;
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setLogo({ file, url });
    }
  };

  const handleSlotUpload = (slotId: string, file: File, displayName?: string) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSlots((prev) => {
        const updatedSlots = prev.map((s) =>
          s.id === slotId
            ? { ...s, image: { file, url, width: img.width, height: img.height, rotation: 0, displayName: displayName || file.name.replace(/\.[^/.]+$/, "").toUpperCase() } }
            : s
        );
        
        // Auto-create new slot if all slots are filled
        if (updatedSlots.every(s => s.image)) {
          updatedSlots.push({ id: Math.random().toString(36).substr(2, 9), image: null });
        }
        return updatedSlots;
      });
    };
    img.src = url;
  };

  const handleBulkUpload = (files: FileList | null) => {
    if (!files) return;
    const filesArray = Array.from(files);
    
    filesArray.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setSlots((prev) => {
          const emptySlotIndex = prev.findIndex(s => !s.image);
          if (emptySlotIndex !== -1) {
            const newSlots = [...prev];
            newSlots[emptySlotIndex] = {
              ...newSlots[emptySlotIndex],
              image: { file, url, width: img.width, height: img.height, rotation: 0, displayName: file.name.replace(/\.[^/.]+$/, "").toUpperCase() }
            };
            return newSlots;
          }
          return [
            ...prev,
            {
              id: Math.random().toString(36).substr(2, 9),
              image: { file, url, width: img.width, height: img.height, rotation: 0, displayName: file.name.replace(/\.[^/.]+$/, "").toUpperCase() },
            },
          ];
        });
      };
      img.src = url;
    });
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, { id: Math.random().toString(36).substr(2, 9), image: null }]);
  };

  const removeSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const rotateSlotImage = (id: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id && s.image ? { ...s, image: { ...s.image, rotation: (s.image.rotation + 90) % 360 } } : s)));
  };

  const renameSlotImage = (id: string, name: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id && s.image ? { ...s, image: { ...s.image, displayName: name.toUpperCase() } } : s)));
  };

  const clearSlotImage = (id: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, image: null } : s)));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDropToSlot = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSlotUpload(slotId, e.dataTransfer.files[0]);
    }
  };

  const onDropBulk = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      handleBulkUpload(e.dataTransfer.files);
    }
  };

  const bgColors = {
    "gray-black": "bg-[#141414]",
    "brown-black": "bg-[#1a1414]",
    "white": "bg-white",
  };

  const inkColors = {
    "gray-black": "text-white",
    "brown-black": "text-white",
    "white": "text-black",
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSlots((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const downloadFullGrid = async () => {
    const filledSlots = slots.filter(s => s.image);
    if (filledSlots.length === 0) return;
    setIsDownloading(true);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Layout logic: 2 columns
    const width = 2400;
    const gap = 40;
    const padding = 60;
    const colWidth = (width - padding * 2 - gap) / 2;
    
    // Calculate heights for two columns
    let col1Height = padding;
    let col2Height = padding;
    
    const imagePositions: { img: any; x: number; y: number; w: number; h: number; name: string; rotation: number }[] = [];

    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    };

    try {
      for (const slot of filledSlots) {
        if (!slot.image) continue;
        const img = await loadImage(slot.image.url);
        
        // Swap dimensions if rotated 90 or 270
        const isRotated = slot.image.rotation % 180 !== 0;
        const imgW = isRotated ? slot.image.height : slot.image.width;
        const imgH = isRotated ? slot.image.width : slot.image.height;
        
        const h = (colWidth / imgW) * imgH;
        
        if (col1Height <= col2Height) {
          imagePositions.push({ img, x: padding, y: col1Height, w: colWidth, h, name: slot.image.displayName, rotation: slot.image.rotation });
          col1Height += h + gap;
        } else {
          imagePositions.push({ img, x: padding + colWidth + gap, y: col2Height, w: colWidth, h, name: slot.image.displayName, rotation: slot.image.rotation });
          col2Height += h + gap;
        }
      }

      const totalHeight = Math.max(col1Height, col2Height) + padding + (logo ? 200 : 0);
      canvas.width = width;
      canvas.height = totalHeight;

      // 1. Draw Background
      if (bgImage) {
        const bgImg = await loadImage(bgImage.url);
        // Draw background image with cover logic
        const bgAspect = bgImg.width / bgImg.height;
        const canvasAspect = width / totalHeight;
        let sx, sy, sw, sh;
        if (bgAspect > canvasAspect) {
          sh = bgImg.height;
          sw = bgImg.height * canvasAspect;
          sx = (bgImg.width - sw) / 2;
          sy = 0;
        } else {
          sw = bgImg.width;
          sh = bgImg.width / canvasAspect;
          sx = 0;
          sy = (bgImg.height - sh) / 2;
        }
        ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, width, totalHeight);
        // Add a slight overlay to make images pop
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, width, totalHeight);
      } else {
        ctx.fillStyle = background === "white" ? "#ffffff" : background === "brown-black" ? "#1a1414" : "#141414";
        ctx.fillRect(0, 0, width, totalHeight);
      }

      // 2. Draw Images
      for (const pos of imagePositions) {
        ctx.save();
        ctx.translate(pos.x + pos.w / 2, pos.y + pos.h / 2);
        ctx.rotate((pos.rotation * Math.PI) / 180);
        
        // Draw image centered
        // Need to adjust drawing based on rotation
        const isRotated = pos.rotation % 180 !== 0;
        const drawW = isRotated ? pos.h : pos.w;
        const drawH = isRotated ? pos.w : pos.h;
        
        ctx.drawImage(pos.img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
        
        if (showImageNames) {
          ctx.save();
          const cleanName = pos.name.toUpperCase();
          
          // Font settings - optimized for high-res canvas (2400px width)
          ctx.font = "bold 38px sans-serif";
          ctx.textBaseline = "middle";
          
          const textMetrics = ctx.measureText(cleanName);
          const textPaddingH = 32;
          const bgWidth = textMetrics.width + textPaddingH * 2;
          const bgHeight = 72;
          
          const isDark = background !== "white";
          
          // Position label at bottom-left of the image
          const labelX = pos.x + 30;
          const labelY = pos.y + pos.h - 30 - bgHeight;
          
          // Draw background box (matching preview's glass effect)
          ctx.fillStyle = isDark ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.85)";
          
          const r = 16; // Corner radius
          ctx.beginPath();
          ctx.moveTo(labelX + r, labelY);
          ctx.lineTo(labelX + bgWidth - r, labelY);
          ctx.quadraticCurveTo(labelX + bgWidth, labelY, labelX + bgWidth, labelY + r);
          ctx.lineTo(labelX + bgWidth, labelY + bgHeight - r);
          ctx.quadraticCurveTo(labelX + bgWidth, labelY + bgHeight, labelX + bgWidth - r, labelY + bgHeight);
          ctx.lineTo(labelX + r, labelY + bgHeight);
          ctx.quadraticCurveTo(labelX, labelY + bgHeight, labelX, labelY + bgHeight - r);
          ctx.lineTo(labelX, labelY + r);
          ctx.quadraticCurveTo(labelX, labelY, labelX + r, labelY);
          ctx.closePath();
          ctx.fill();
          
          // Draw subtle border (matching preview's border-white/10)
          ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)";
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw text with high contrast
          ctx.fillStyle = isDark ? "#FFFFFF" : "#000000";
          ctx.fillText(cleanName, labelX + textPaddingH, labelY + bgHeight / 2 + 3);
          ctx.restore();
        }
      }

      // 3. Draw Logo
      if (logo) {
        const logoImg = await loadImage(logo.url);
        const logoHeight = 120;
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
        ctx.globalAlpha = 0.6;
        ctx.drawImage(logoImg, (width - logoWidth) / 2, totalHeight - logoHeight - 60, logoWidth, logoHeight);
        ctx.globalAlpha = 1.0;
      }

      // Download
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `grid-collage-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating full grid image:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const isDarkBg = background !== "white";

  // Masonry layout logic for preview
  const col1Slots: GridSlot[] = [];
  const col2Slots: GridSlot[] = [];
  let h1 = 0;
  let h2 = 0;

  slots.forEach((slot) => {
    const aspect = slot.image ? slot.image.width / slot.image.height : 1.5;
    const relativeHeight = 1 / aspect;

    if (h1 <= h2) {
      col1Slots.push(slot);
      h1 += relativeHeight;
    } else {
      col2Slots.push(slot);
      h2 += relativeHeight;
    }
  });

  const renderSlot = (slot: GridSlot) => (
    <SortableSlot 
      key={slot.id} 
      slot={slot} 
      onDragOver={onDragOver}
      onDropToSlot={onDropToSlot}
      handleSlotUpload={handleSlotUpload}
      setBgImage={setBgImage}
      clearSlotImage={clearSlotImage}
      removeSlot={removeSlot}
      showImageNames={showImageNames}
      isDarkBg={isDarkBg}
      slotInputRefs={slotInputRefs}
      onRenameSlot={renameSlotImage}
      onRotateSlot={rotateSlotImage}
    />
  );

  return (
    <div className={clsx("min-h-screen font-sans transition-colors duration-500", bgColors[background])}>
      <div className="max-w-7xl mx-auto p-6 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-2">
            <h1 className={clsx("text-4xl font-bold tracking-tight", inkColors[background])}>
              Grid Builder
            </h1>
            <p className="text-neutral-500 text-sm">
              Manual layout with drag-and-drop cells.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSlots(slots.map(s => ({ ...s, image: null })))}
              className="flex-1 py-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
            >
              Clear All
            </button>
            <button
              onClick={() => {
                setLogo(null);
                setBgImage(null);
                setSlots([
                  { id: "1", image: null },
                  { id: "2", image: null },
                  { id: "3", image: null },
                ]);
                setBackground("gray-black");
                setShowImageNames(false);
              }}
              className="flex-1 py-3 rounded-2xl bg-neutral-800 text-neutral-400 border border-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-700 transition-all"
            >
              Reset All
            </button>
          </div>

          <div className="space-y-6 bg-neutral-900/10 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
            
            {/* Background Selection */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4" /> Background
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "gray-black", label: "Dark", color: "bg-[#141414]" },
                  { id: "brown-black", label: "Warm", color: "bg-[#1a1414]" },
                  { id: "white", label: "Light", color: "bg-white" }
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => { setBackground(bg.id as any); setBgImage(null); }}
                    className={clsx(
                      "group relative flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all",
                      background === bg.id && !bgImage
                        ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10" 
                        : "border-white/5 bg-neutral-900/20 hover:border-white/20"
                    )}
                  >
                    <div className={clsx("w-full aspect-square rounded-xl border border-white/10", bg.color)} />
                    <span className={clsx("text-[10px] font-bold uppercase tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity", bg.id === 'white' ? 'text-orange-500' : 'text-white')}>
                      {bg.label}
                    </span>
                    {background === bg.id && !bgImage && (
                      <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-emerald-500 fill-neutral-950" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Background Image */}
              <div 
                onClick={() => bgImageInputRef.current?.click()}
                className={clsx(
                  "relative h-20 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group mt-2",
                  bgImage ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-white/20"
                )}
              >
                <input
                  type="file"
                  ref={bgImageInputRef}
                  onChange={handleBgImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                {bgImage ? (
                  <>
                    <img src={bgImage.url} className="w-full h-full object-cover opacity-40" alt="BG" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold uppercase text-white drop-shadow-md">BG Image Active</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setBgImage(null); }}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-5 h-5 text-neutral-500 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[10px] text-neutral-500 font-bold mt-1 uppercase">Custom BG Image</span>
                  </>
                )}
              </div>
            </div>

            {/* Brand Logo */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Brand Logo
              </label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className={clsx(
                  "relative h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group",
                  logo ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-white/20"
                )}
              >
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                {logo ? (
                  <>
                    <img src={logo.url} className="h-16 object-contain" alt="Logo" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setLogo(null); }}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-neutral-500 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[10px] text-neutral-500 font-bold mt-2 uppercase">Upload Logo</span>
                  </>
                )}
              </div>
            </div>

            {/* Toggle Name */}
            <div className="flex items-center justify-between p-4 bg-neutral-900/20 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <Type className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Show Image Names</span>
              </div>
              <button
                onClick={() => setShowImageNames(!showImageNames)}
                className={clsx(
                  "w-12 h-6 rounded-full transition-all relative",
                  showImageNames ? "bg-emerald-500" : "bg-neutral-800"
                )}
              >
                <div className={clsx(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  showImageNames ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadFullGrid}
            disabled={slots.every(s => !s.image) || isDownloading}
            className={clsx(
              "w-full py-5 rounded-3xl font-bold text-sm tracking-widest transition-all flex items-center justify-center gap-3 uppercase shadow-2xl",
              (slots.every(s => !s.image) || isDownloading)
                ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                : "bg-emerald-500 text-black hover:scale-[1.02] active:scale-95 shadow-emerald-500/20"
            )}
          >
            {isDownloading ? (
              <>
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Tải về toàn bộ (Download Grid)
              </>
            )}
          </button>
        </div>

        {/* Grid Canvas */}
        <div className="lg:col-span-8 space-y-6">
          {/* Bulk Upload Area */}
          <div 
            className="w-full h-32 rounded-3xl border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-500/10 transition-all group"
            onClick={() => bulkInputRef.current?.click()}
            onDragOver={onDragOver}
            onDrop={onDropBulk}
          >
            <input
              type="file"
              ref={bulkInputRef}
              onChange={(e) => handleBulkUpload(e.target.files)}
              accept="image/*"
              multiple
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-full text-black">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-emerald-500 uppercase tracking-widest">Tải lên nhiều ảnh (Bulk Upload)</span>
                <span className="block text-[10px] text-emerald-500/60 font-medium uppercase">Kéo thả hoặc click để thêm nhiều ảnh cùng lúc</span>
              </div>
            </div>
          </div>

          <div 
            className="min-h-[600px] w-full rounded-3xl border-2 border-dashed border-white/10 bg-neutral-900/20 p-8 flex flex-col items-center justify-start gap-8 relative"
          >
            {/* Background Image Preview in Editor */}
            {bgImage && (
              <div className="absolute inset-0 z-0 opacity-20">
                <img src={bgImage.url} className="w-full h-full object-cover" alt="Editor BG" />
              </div>
            )}

            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={slots.map(s => s.id)}
                strategy={rectSortingStrategy}
              >
                <div className="w-full grid grid-cols-2 gap-4 relative z-10 max-w-4xl">
                  {slots.map(renderSlot)}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add New Slot Button */}
            <button 
              onClick={addSlot}
              className="w-full max-w-4xl h-16 rounded-2xl border-2 border-dashed border-orange-500/30 bg-orange-500/5 flex items-center justify-center gap-3 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all group relative z-10"
            >
              <Plus className="w-5 h-5 text-neutral-700 group-hover:text-emerald-500 transition-colors" />
              <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-widest group-hover:text-neutral-400">
                Add New Slot
              </span>
            </button>
          </div>

          {/* Logo Overlay on Canvas */}
          {logo && (
            <div className="mt-8 flex justify-center">
              <img src={logo.url} className="h-12 object-contain opacity-50 hover:opacity-100 transition-opacity" alt="Brand Logo" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

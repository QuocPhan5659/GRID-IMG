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
  onRotateSlot,
  index,
  layoutType
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
  index: number;
  layoutType: string;
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

  const slotSpecificStyle = (layoutType === '1x2' && index === 0) ? { gridRow: 'span 2' } : {};

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
    touchAction: 'none',
    ...slotSpecificStyle
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
        "relative group rounded-[2cqw] overflow-hidden border-2 border-dashed transition-all duration-200 cursor-grab active:cursor-grabbing w-full h-full min-h-[120px]",
        slot.image 
          ? "border-white/10 bg-transparent shadow-xl" 
          : "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50 hover:bg-purple-500/10"
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
        <div 
          className="w-full h-full relative flex items-center justify-center bg-transparent"
          style={{ containerType: 'size' }}
        >
          <div 
            className="absolute flex items-center justify-center transition-all duration-300"
            style={{
              width: slot.image.rotation % 180 !== 0 ? '100cqh' : '100cqw',
              height: slot.image.rotation % 180 !== 0 ? '100cqw' : '100cqh',
              transform: `rotate(${slot.image.rotation}deg)`,
            }}
          >
            <img 
              src={slot.image.url} 
              className="w-full h-full object-contain pointer-events-none select-none" 
              alt={slot.image.file.name} 
            />
          </div>
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
                  <Pencil className="w-3 h-3 cursor-pointer hover:text-purple-500" onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} />
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
          <Upload className="w-6 h-6 text-neutral-600 mb-2 group-hover:text-purple-500 transition-colors pointer-events-none" />
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
  const [ratio, setRatio] = useState<string>('1:1');
  const [bgImage, setBgImage] = useState<ImageInfo | null>(null);
  const [logo, setLogo] = useState<{ file: File; url: string } | null>(null);
  const [showImageNames, setShowImageNames] = useState(false);
  const [layoutType, setLayoutType] = useState<'2col' | '1col' | '2row' | '2x2' | '1x2'>('2col');

  const ratioConfigs = [
    { id: '16:9', value: 16/9 },
    { id: '1:1', value: 1 },
    { id: '3:2', value: 3/2 },
    { id: '4:3', value: 4/3 },
  ];

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

    // Layout logic mapping perfect to grid
    const width = 2400;
    const ratioValue = ratioConfigs.find(r => r.id === ratio)?.value || 1;
    const height = Math.round(width / ratioValue);
    
    // Determine canvas final output height (incorporating logo below grid if present)
    const logoAreaHeight = logo ? 200 : 0;
    const totalHeight = height + logoAreaHeight;
    
    canvas.width = width;
    canvas.height = totalHeight;

    const gap = 40;
    const padding = 60;
    
    const gridW = width - padding * 2;
    const gridH = height - padding * 2;
    
    let imagePositions: { img: HTMLImageElement; x: number; y: number; w: number; h: number; name: string; rotation: number }[] = [];

    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    };

    try {
      const images = await Promise.all(filledSlots.map(async (slot) => {
        const img = await loadImage(slot.image!.url);
        const imgW = img.width;
        const imgH = img.height;
        return { img, imgW, imgH, name: slot.image!.displayName, rotation: slot.image!.rotation };
      }));

      const count = images.length;

      if (layoutType === '1col') {
        const rows = count || 1;
        const cellH = (gridH - gap * (rows - 1)) / rows;
        images.forEach((imgData, i) => {
          imagePositions.push({ ...imgData, x: padding, y: padding + i * (cellH + gap), w: gridW, h: cellH });
        });
      } else if (layoutType === '2col') {
        const cols = 2;
        const rows = Math.ceil(count / 2) || 1;
        const cellW = (gridW - gap) / 2;
        const cellH = (gridH - gap * (rows - 1)) / rows;
        images.forEach((imgData, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          imagePositions.push({ ...imgData, x: padding + c * (cellW + gap), y: padding + r * (cellH + gap), w: cellW, h: cellH });
        });
      } else if (layoutType === '2row') {
        const rows = 2;
        const cols = Math.ceil(count / 2) || 1;
        const cellW = (gridW - gap * (cols - 1)) / cols;
        const cellH = (gridH - gap) / 2;
        images.forEach((imgData, i) => {
          const c = Math.floor(i / rows);
          const r = i % rows;
          imagePositions.push({ ...imgData, x: padding + c * (cellW + gap), y: padding + r * (cellH + gap), w: cellW, h: cellH });
        });
      } else if (layoutType === '2x2') {
        const cols = 2;
        const rows = 2;
        const cellW = (gridW - gap) / 2;
        const cellH = (gridH - gap) / 2;
        images.forEach((imgData, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          imagePositions.push({ ...imgData, x: padding + c * (cellW + gap), y: padding + r * (cellH + gap), w: cellW, h: cellH });
        });
      } else if (layoutType === '1x2') {
        const leftW = (gridW - gap) * 0.6;
        const rightW = gridW - gap - leftW;
        const rightH = (gridH - gap) / 2;
        images.forEach((imgData, i) => {
          if (i === 0) {
            imagePositions.push({ ...imgData, x: padding, y: padding, w: leftW, h: gridH });
          } else {
            const r = (i - 1) % 2; // For >3 images, they just stack perfectly over the right slots
            imagePositions.push({ ...imgData, x: padding + leftW + gap, y: padding + r * (rightH + gap), w: rightW, h: rightH });
          }
        });
      }

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

      // 2. Draw Images perfectly within computed rect mapped to Object Cover approach
      for (const pos of imagePositions) {
        ctx.save();
        
        // Setup clip for rounded corners exactly like preview
        const cornerRadius = 40;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(pos.x, pos.y, pos.w, pos.h, cornerRadius);
        } else {
          ctx.rect(pos.x, pos.y, pos.w, pos.h);
        }
        ctx.clip();

        ctx.translate(pos.x + pos.w / 2, pos.y + pos.h / 2);
        ctx.rotate((pos.rotation * Math.PI) / 180);
        
        // Determine object contain coordinates mapping
        const isRotated = pos.rotation % 180 !== 0;
        const drawBoundW = isRotated ? pos.h : pos.w;
        const drawBoundH = isRotated ? pos.w : pos.h;

        const imgAspect = pos.img.width / pos.img.height;
        const rectAspect = drawBoundW / drawBoundH;
        
        let dx, dy, dw, dh;
        
        if (imgAspect > rectAspect) {
          dw = drawBoundW;
          dh = drawBoundW / imgAspect;
          dx = -dw / 2;
          dy = -dh / 2;
        } else {
          dh = drawBoundH;
          dw = drawBoundH * imgAspect;
          dx = -dw / 2;
          dy = -dh / 2;
        }
        
        ctx.drawImage(pos.img, dx, dy, dw, dh);
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

  const getGridStyle = (type: string, count: number) => {
    switch (type) {
        case '1col': return { gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: `repeat(${count || 1}, minmax(0, 1fr))` };
        case '2col': return { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: `repeat(${Math.ceil(count / 2) || 1}, minmax(0, 1fr))` };
        case '2row': return { gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gridAutoFlow: 'column', gridTemplateColumns: `repeat(${Math.ceil(count / 2) || 1}, minmax(0, 1fr))` };
        case '2x2': return { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))' };
        case '1x2': return { gridTemplateColumns: '1.5fr 1fr', gridTemplateRows: 'repeat(2, minmax(0, 1fr))' };
        default: return {};
    }
  };

  const renderSlot = (slot: GridSlot, index: number) => (
    <SortableSlot 
      key={slot.id} 
      slot={slot} 
      index={index}
      layoutType={layoutType}
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
          <div className="space-y-4 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-fuchsia-400 to-purple-600 bg-clip-text text-transparent uppercase inline-block">
              SuQ GRIDs
            </h1>
            <div className="inline-flex items-center justify-center p-[1px] rounded-full bg-gradient-to-r from-neutral-800 to-neutral-700">
              <div className="px-4 py-1.5 rounded-full bg-[#111] text-purple-400 font-mono text-[10px] sm:text-xs">
                <span className="font-bold">Zalo QuocPhan:</span> 0938355659
              </div>
            </div>
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
            
            {/* Ratio Selection */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-purple-400/80 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Ratio
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ratioConfigs.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRatio(r.id)}
                    className={clsx(
                      "py-2 rounded-lg text-[10px] font-bold uppercase transition-all border",
                      ratio === r.id
                        ? "bg-purple-500 text-black border-purple-500" 
                        : "bg-neutral-800 text-neutral-400 border-white/5 hover:border-white/20"
                    )}
                  >
                    {r.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Selection */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-purple-400/80 uppercase tracking-widest flex items-center gap-2">
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
                        ? "border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10" 
                        : "border-white/5 bg-neutral-900/20 hover:border-white/20"
                    )}
                  >
                    <div className={clsx("w-full aspect-square rounded-xl border border-white/10", bg.color)} />
                    <span className={clsx("text-[10px] font-bold uppercase tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity", bg.id === 'white' ? 'text-orange-500' : 'text-white')}>
                      {bg.label}
                    </span>
                    {background === bg.id && !bgImage && (
                      <CheckCircle2 className="absolute -top-1 -right-1 w-4 h-4 text-purple-500 fill-neutral-950" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Background Image */}
              <div 
                onClick={() => bgImageInputRef.current?.click()}
                className={clsx(
                  "relative h-20 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group mt-2",
                  bgImage ? "border-purple-500/50 bg-purple-500/5" : "border-white/10 hover:border-white/20"
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
                    <ImagePlus className="w-5 h-5 text-neutral-500 group-hover:text-purple-500 transition-colors" />
                    <span className="text-[10px] text-neutral-500 font-bold mt-1 uppercase">Custom BG Image</span>
                  </>
                )}
              </div>
            </div>

            {/* Brand Logo */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-purple-400/80 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Brand Logo
              </label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className={clsx(
                  "relative h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group",
                  logo ? "border-purple-500/50 bg-purple-500/5" : "border-white/10 hover:border-white/20"
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
                    <Upload className="w-6 h-6 text-neutral-500 group-hover:text-purple-500 transition-colors" />
                    <span className="text-[10px] text-neutral-500 font-bold mt-2 uppercase">Upload Logo</span>
                  </>
                )}
              </div>
            </div>

            {/* Toggle Name */}
            <div className="flex items-center justify-between p-4 bg-neutral-900/20 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <Type className="w-4 h-4 text-purple-400/80" />
                <span className="text-xs font-bold text-purple-400/80 uppercase tracking-wider">Show Image Names</span>
              </div>
              <button
                onClick={() => setShowImageNames(!showImageNames)}
                className={clsx(
                  "w-12 h-6 rounded-full transition-all relative",
                  showImageNames ? "bg-purple-500" : "bg-neutral-800"
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
                : "bg-purple-500 text-black hover:scale-[1.02] active:scale-95 shadow-purple-500/20"
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
            className="w-full h-32 rounded-3xl border-2 border-dashed border-purple-500/20 bg-purple-500/5 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-500/10 transition-all group"
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
              <div className="p-2 bg-purple-500 rounded-full text-black">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-purple-500 uppercase tracking-widest">Tải lên nhiều ảnh (Bulk Upload)</span>
                <span className="block text-[10px] text-purple-500/60 font-medium uppercase">Kéo thả hoặc click để thêm nhiều ảnh cùng lúc</span>
              </div>
            </div>
          </div>

          {/* Layout Selection */}
          <div className="space-y-4 bg-neutral-900/20 p-6 rounded-3xl border border-white/5">
            <label className="text-xs font-bold text-purple-400/80 uppercase tracking-widest flex items-center gap-2">
              <GripVertical className="w-4 h-4" /> Layout
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['2col', '1col', '2row', '2x2', '1x2'] as const).map((type) => {
                const LayoutIcon = () => {
                  switch (type) {
                    case '1col': return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="1"/></svg>;
                    case '2col': return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="9" height="20" rx="1"/><rect x="13" y="2" width="9" height="20" rx="1"/></svg>;
                    case '2row': return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="9" rx="1"/><rect x="2" y="13" width="20" height="9" rx="1"/></svg>;
                    case '2x2': return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>;
                    case '1x2': return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="10" height="20" rx="1"/><rect x="14" y="2" width="8" height="9" rx="1"/><rect x="14" y="13" width="8" height="9" rx="1"/></svg>;
                    default: return null;
                  }
                };
                return (
                  <button
                    key={type}
                    onClick={() => setLayoutType(type)}
                    className={clsx(
                      "flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-bold uppercase transition-all border gap-1",
                      layoutType === type 
                        ? "bg-purple-500 text-black border-purple-500" 
                        : "bg-neutral-800 text-neutral-400 border-white/5 hover:border-white/20"
                    )}
                  >
                    <LayoutIcon />
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full bg-neutral-900/20 rounded-3xl border border-white/10 p-4 lg:p-8 flex items-center justify-center min-h-[600px] relative overflow-hidden">
            {/* The Actual Preview Container matching Ratio */}
            <div 
              className={clsx(
                "relative flex transition-all duration-300 shadow-2xl overflow-hidden",
                bgColors[background]
              )}
              style={{
                aspectRatio: ratioConfigs.find(r => r.id === ratio)?.value || 1,
                maxHeight: '700px',
                maxWidth: '100%',
                backgroundImage: bgImage ? `url(${bgImage.url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                width: '100%',
                ...(((ratioConfigs.find(r => r.id === ratio)?.value || 1) < 1) ? { width: 'auto', height: '100%' } : { width: '100%', height: 'auto' })
              }}
            >
              {bgImage && <div className="absolute inset-0 bg-black/20" />} 

            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={slots.map(s => s.id)}
                strategy={rectSortingStrategy}
              >
                <div 
                  className="w-full h-full relative z-10 p-4 sm:p-6 lg:p-10"
                  style={{
                    display: 'grid',
                    gap: '12px',
                    ...getGridStyle(layoutType, slots.length)
                  }}
                >
                  {slots.map((slot, i) => renderSlot(slot, i))}
                </div>
              </SortableContext>
            </DndContext>
            </div>
            
            {/* Add New Slot Button (Floating over container) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <button 
                onClick={addSlot}
                className="h-10 px-6 rounded-full border border-purple-500/30 bg-black/80 backdrop-blur-md flex items-center justify-center gap-2 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all group shadow-2xl text-white"
              >
                <Plus className="w-4 h-4 group-hover:text-purple-500 transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-purple-400">
                  Add New Slot
                </span>
              </button>
            </div>
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

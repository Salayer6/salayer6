import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { Note, Connection, ConnectionStyle } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import TrashIcon from './icons/TrashIcon';
import DownloadIcon from './icons/DownloadIcon';
import HelpIcon from './icons/HelpIcon';
import MoveHorizontalIcon from './icons/MoveHorizontalIcon';
import MinusIcon from './icons/MinusIcon';
import ArrowUpRightIcon from './icons/ArrowUpRightIcon';

const HelpModal = lazy(() => import('./HelpModal'));

const NOTE_COLORS = [
    'bg-yellow-200 dark:bg-yellow-800 border-yellow-300 dark:border-yellow-700',
    'bg-blue-200 dark:bg-blue-800 border-blue-300 dark:border-blue-700',
    'bg-green-200 dark:bg-green-800 border-green-300 dark:border-green-700',
    'bg-pink-200 dark:bg-pink-800 border-pink-300 dark:border-pink-700',
    'bg-purple-200 dark:bg-purple-800 border-purple-300 dark:border-purple-700'
];

const CONNECTION_COLORS = [
    '#64748b', // slate-500
    '#ef4444', // red-500
    '#22c55e', // green-500
    '#3b82f6', // blue-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
];

const LINE_STYLES: ConnectionStyle[] = ['line', 'arrow1', 'arrow2', 'arrow-both'];

const FULL_COLOR_MAP: Record<string, string> = {
    'bg-yellow-200': '#fef08a', 'dark:bg-yellow-800': '#713f12', 'border-yellow-300': '#fde047', 'dark:border-yellow-700': '#a16207',
    'bg-blue-200': '#bfdbfe', 'dark:bg-blue-800': '#1e3a8a', 'border-blue-300': '#93c5fd', 'dark:border-blue-700': '#1e40af',
    'bg-green-200': '#bbf7d0', 'dark:bg-green-800': '#14532d', 'border-green-300': '#86efac', 'dark:border-green-700': '#166534',
    'bg-pink-200': '#fbcfe8', 'dark:bg-pink-800': '#831843', 'border-pink-300': '#f9a8d4', 'dark:border-pink-700': '#9d174d',
    'bg-purple-200': '#e9d5ff', 'dark:bg-purple-800': '#581c87', 'border-purple-300': '#d8b4fe', 'dark:border-purple-700': '#6b21a8',
};

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });

const NotesBoard: React.FC = () => {
    const { t } = useTranslation();
    const [notes, setNotes] = useState<Note[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const boardRef = useRef<HTMLDivElement>(null);
    const noteRefs = useRef<Record<string, HTMLDivElement>>({});
    const mousePositionRef = useRef({ x: 0, y: 0 });

    const [draggingNote, setDraggingNote] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const [connecting, setConnecting] = useState<{ startNoteId: string, startEl: HTMLDivElement } | null>(null);
    const [lineColor, setLineColor] = useState(CONNECTION_COLORS[0]);
    const [lineStyle, setLineStyle] = useState<ConnectionStyle>('line');

    const handleDeleteNote = (id: string) => {
        setNotes(notes.filter(n => n.id !== id));
        setConnections(connections.filter(c => c.startNoteId !== id && c.endNoteId !== id));
    };

    const handleNoteMouseDown = (e: React.MouseEvent, id: string) => {
        if (e.target instanceof HTMLButtonElement || e.target instanceof SVGElement || e.target instanceof HTMLTextAreaElement) {
             return;
        }
        const noteEl = noteRefs.current[id];
        if (!noteEl) return;
        const rect = noteEl.getBoundingClientRect();
        const boardRect = boardRef.current?.getBoundingClientRect();
        if(!boardRect) return;

        setDraggingNote({
            id,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
        });
    };
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingNote || !boardRef.current) return;
        const boardRect = boardRef.current.getBoundingClientRect();
        const x = e.clientX - boardRect.left - draggingNote.offsetX;
        const y = e.clientY - boardRect.top - draggingNote.offsetY;

        setNotes(prevNotes =>
            prevNotes.map(n =>
                n.id === draggingNote.id ? { ...n, x, y } : n
            )
        );
    }, [draggingNote]);

    const handleMouseUp = useCallback(() => {
        setDraggingNote(null);
    }, []);

    useEffect(() => {
        if (draggingNote) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingNote, handleMouseMove, handleMouseUp]);


    const handleStartConnection = (e: React.MouseEvent, startNoteId: string) => {
        e.stopPropagation();
        const startEl = noteRefs.current[startNoteId];
        if (startEl) {
            setConnecting({ startNoteId, startEl });
        }
    };
    
    const handleNoteClickForConnection = (clickedNoteId: string) => {
        if (connecting && connecting.startNoteId !== clickedNoteId) {
            const newConnection: Connection = {
                id: crypto.randomUUID(),
                startNoteId: connecting.startNoteId,
                endNoteId: clickedNoteId,
                color: lineColor,
                style: lineStyle,
            };
            setConnections(prev => [...prev, newConnection]);
            setConnecting(null);
        }
    };

    const handleLineClick = (connId: string) => {
        setConnections(prev => prev.filter(c => c.id !== connId));
    };

    const constructSvgString = useCallback(async (): Promise<string> => {
        const boardElement = boardRef.current;
        if (!boardElement) return '';

        const { width, height } = boardElement.getBoundingClientRect();
        const isDarkMode = document.documentElement.classList.contains('dark');
        const bgColor = isDarkMode ? '#0f172a' : '#f1f5f9'; // slate-950 and slate-100

        const noteElements = notes.map(note => {
            const [bgLightClass, bgDarkClass, borderLightClass, borderDarkClass] = note.color.split(' ');
            const finalBgColor = isDarkMode ? FULL_COLOR_MAP[bgDarkClass] : FULL_COLOR_MAP[bgLightClass];
            const finalBorderColor = isDarkMode ? FULL_COLOR_MAP[borderDarkClass] : FULL_COLOR_MAP[borderLightClass];
            const textColor = isDarkMode ? '#f1f5f9' : '#1e293b';

            const sanitizedContent = note.content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const textContent = `<div style="font-size: 12px; white-space: pre-wrap; word-wrap: break-word; color: ${textColor};">${sanitizedContent}</div>`;
            const imageContent = note.imageUrl ? `<image href="${note.imageUrl}" x="10" y="10" width="76" height="76" preserveAspectRatio="xMidYMid meet" />` : '';
            
            return `<foreignObject x="${note.x}" y="${note.y}" width="96" height="96">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width: 96px; height: 96px; border: 1px solid ${finalBorderColor}; background-color: ${finalBgColor}; border-radius: 0.5rem; padding: 8px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; text-align: center;">
                    ${note.imageUrl ? imageContent : textContent}
                </div>
            </foreignObject>`;
        }).join('');

        const connectionElements = connections.map(conn => {
            const startNote = notes.find(n => n.id === conn.startNoteId);
            const endNote = notes.find(n => n.id === conn.endNoteId);
            if (!startNote || !endNote) return '';
            
            const [x1, y1] = [startNote.x + 48, startNote.y + 48];
            const [x2, y2] = [endNote.x + 48, endNote.y + 48];

            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${conn.color}" stroke-width="2" marker-start="${conn.style === 'arrow1' || conn.style === 'arrow-both' ? `url(#arrowhead-${conn.id})` : ''}" marker-end="${conn.style === 'arrow2' || conn.style === 'arrow-both' ? `url(#arrowhead-${conn.id})` : ''}" />`;
        }).join('');

        const defs = connections.map(conn => `<marker id="arrowhead-${conn.id}" markerWidth="10" markerHeight="7" refX="8.5" refY="3.5" orient="auto" fill="${conn.color}"><polygon points="0 0, 10 3.5, 0 7" /></marker>`).join('');

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            <rect width="100%" height="100%" fill="${bgColor}" />
            <defs>${defs}</defs>
            <g>${connectionElements}</g>
            <g>${noteElements}</g>
        </svg>`;
    }, [notes, connections]);


    const handleExport = useCallback(async () => {
        const svgContent = await constructSvgString();
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'study-hub-board.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [constructSvgString]);
    
    
    const handleBoardMouseMove = useCallback((e: React.MouseEvent) => {
        if (boardRef.current) {
            const rect = boardRef.current.getBoundingClientRect();
            mousePositionRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
    }, []);

    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        e.preventDefault();
        const items = e.clipboardData.items;
        const board = boardRef.current;
        if (!board) return;

        let pastedText: string | null = null;
        let pastedImageFile: File | null = null;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                pastedImageFile = item.getAsFile();
                break; 
            }
             if (item.type === 'text/plain') {
                pastedText = await new Promise(resolve => item.getAsString(resolve));
            }
        }
        
        const dropX = mousePositionRef.current.x ? mousePositionRef.current.x - 48 : 20;
        const dropY = mousePositionRef.current.y ? mousePositionRef.current.y - 48 : 20;

        // FIX: Add missing 'title' property to conform to the Note type.
        const newNote: Note = {
            id: crypto.randomUUID(),
            title: '',
            content: '',
            color: NOTE_COLORS[notes.length % NOTE_COLORS.length],
            x: dropX,
            y: dropY,
        };

        if (pastedImageFile) {
            newNote.imageUrl = await fileToBase64(pastedImageFile);
            newNote.content = 'Image';
        } else if (pastedText) {
            newNote.content = pastedText.trim();
        } else {
            return;
        }

        setNotes(prev => [...prev, newNote]);

    }, [notes]);

    return (
        <div className="relative w-full h-full bg-slate-100 dark:bg-slate-950 rounded-lg shadow-inner overflow-hidden flex flex-col">
            <header className="absolute top-0 left-0 w-full p-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 pl-2">{t('board.title')}</h3>
                <div className="flex items-center gap-2">
                     <button onClick={handleExport} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label={t('board.exportButtonAria')}>
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsHelpModalOpen(true)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label={t('board.helpButtonAria')}>
                        <HelpIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div ref={boardRef} className="w-full h-full relative flex-grow pt-14" onPaste={handlePaste} onMouseMove={handleBoardMouseMove}>
                <div className="absolute top-14 left-0 w-full p-4">
                     <div className="w-full aspect-[8/1] min-h-[60px] max-h-[80px] flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg " tabIndex={0}>
                        <p className="text-slate-400 dark:text-slate-500 font-semibold pointer-events-none">{t('board.pasteArea')}</p>
                    </div>
                </div>

                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" onClick={() => setConnecting(null)}>
                     <defs>
                        {connections.map(c => (
                             <marker key={`arrow-${c.id}`} id={`arrowhead-${c.id}`} markerWidth="10" markerHeight="7" refX="8.5" refY="3.5" orient="auto" fill={c.color}>
                                <polygon points="0 0, 10 3.5, 0 7" />
                            </marker>
                        ))}
                    </defs>
                    <g>
                    {connections.map(conn => {
                        const startNote = notes.find(n => n.id === conn.startNoteId);
                        const endNote = notes.find(n => n.id === conn.endNoteId);
                        if (!startNote || !endNote) return null;
                        
                        const [x1, y1] = [startNote.x + 48, startNote.y + 48];
                        const [x2, y2] = [endNote.x + 48, endNote.y + 48];
                        
                        return (
                            <line
                                key={conn.id}
                                x1={x1} y1={y1}
                                x2={x2} y2={y2}
                                stroke={conn.color}
                                strokeWidth="2"
                                markerStart={conn.style === 'arrow1' || conn.style === 'arrow-both' ? `url(#arrowhead-${conn.id})` : ''}
                                markerEnd={conn.style === 'arrow2' || conn.style === 'arrow-both' ? `url(#arrowhead-${conn.id})` : ''}
                                onClick={() => handleLineClick(conn.id)}
                                className="pointer-events-auto cursor-pointer"
                            />
                        );
                    })}
                    </g>
                </svg>

                {notes.map(note => (
                    <div
                        key={note.id}
                        ref={el => { if(el) noteRefs.current[note.id] = el }}
                        className={`absolute w-24 h-24 p-2 rounded-lg shadow-md border cursor-grab active:cursor-grabbing group transition-all duration-100 ease-in-out flex items-center justify-center text-center ${note.color} ${connecting?.startNoteId === note.id ? 'ring-4 ring-indigo-500 z-10' : 'hover:shadow-xl'}`}
                        style={{ left: note.x, top: note.y }}
                        onMouseDown={(e) => handleNoteMouseDown(e, note.id)}
                        onClick={() => handleNoteClickForConnection(note.id)}
                    >
                         <button onClick={() => handleDeleteNote(note.id)} className="absolute -top-2 -right-2 p-1 rounded-full bg-white dark:bg-slate-700 shadow-md hover:bg-red-100 dark:hover:bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity z-10" aria-label={t('board.deleteNoteAria')}>
                            <TrashIcon className="w-4 h-4 text-red-500" />
                        </button>
                        
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full cursor-pointer hover:ring-2 hover:ring-indigo-500" onMouseDown={(e) => handleStartConnection(e, note.id)}></div>
                         
                        {note.imageUrl ? (
                            <img src={note.imageUrl} alt="pasted content" className="max-w-full max-h-full object-contain rounded" />
                        ) : (
                             <p className="text-xs text-slate-800 dark:text-slate-100 break-words">{note.content}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                <button onClick={() => setLineStyle(prev => LINE_STYLES[(LINE_STYLES.indexOf(prev) + 1) % LINE_STYLES.length])} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    {lineStyle === 'line' && <MinusIcon className="w-5 h-5 text-slate-600 dark:text-slate-300"/>}
                    {lineStyle === 'arrow1' && <ArrowUpRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-300 transform -scale-x-100 rotate-45"/>}
                    {lineStyle === 'arrow2' && <ArrowUpRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-300 transform rotate-45"/>}
                    {lineStyle === 'arrow-both' && <MoveHorizontalIcon className="w-5 h-5 text-slate-600 dark:text-slate-300"/>}
                </button>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-600"></div>
                {CONNECTION_COLORS.map(color => (
                    <button key={color} onClick={() => setLineColor(color)} className={`w-6 h-6 rounded-full ${lineColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800' : ''}`} style={{ backgroundColor: color }} />
                ))}
            </div>
             <Suspense fallback={null}>
                <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
             </Suspense>
        </div>
    );
};

export default NotesBoard;
import { useState, useRef, useEffect } from "react";
import NavigationLayout from "@/components/NavigationLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Globe,
  Palette,
  Tv,
  Users,
  FileText,
  Gamepad2,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  LayoutGrid as Grid,
} from "lucide-react";
import { useLocation } from "wouter";

export default function MiniApps() {
  const [, setLocation] = useLocation();

  // Modal / Tool States
  const [activeTool, setActiveTool] = useState<"none" | "browser" | "draw" | "watch" | "paste" | "minesweeper">("none");

  // Mini Browser State
  const [browserUrl, setBrowserUrl] = useState("https://wikipedia.org");
  const [currentIframeUrl, setCurrentIframeUrl] = useState("https://wikipedia.org");

  // Watch Together State
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ");
  const [videoInput, setVideoInput] = useState("");

  // Paste Quest State
  const [pasteText, setPasteText] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Drawing Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#B22222");
  const [lineWidth, setLineWidth] = useState(4);

  // Minesweeper State
  const [grid, setGrid] = useState<Array<{ id: number; mine: boolean; revealed: boolean; count: number }>>([]);
  const [gameOver, setGameOver] = useState(false);

  const initMinesweeper = () => {
    const size = 25; // 5x5
    const minesCount = 5;
    let cells = Array.from({ length: size }, (_, i) => ({
      id: i,
      mine: false,
      revealed: false,
      count: 0,
    }));

    // Place mines randomly
    let placed = 0;
    while (placed < minesCount) {
      const idx = Math.floor(Math.random() * size);
      if (!cells[idx].mine) {
        cells[idx].mine = true;
        placed++;
      }
    }

    // Calculate neighboring mine counts
    for (let i = 0; i < size; i++) {
      if (cells[i].mine) continue;
      const row = Math.floor(i / 5);
      const col = i % 5;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < 5 && c >= 0 && c < 5) {
            const neighborIdx = r * 5 + c;
            if (cells[neighborIdx].mine) count++;
          }
        }
      }
      cells[i].count = count;
    }
    setGrid(cells);
    setGameOver(false);
  };

  useEffect(() => {
    if (activeTool === "minesweeper") {
      initMinesweeper();
    }
  }, [activeTool]);

  const handleCellClick = (idx: number) => {
    if (gameOver || grid[idx].revealed) return;
    const nextGrid = [...grid];
    nextGrid[idx].revealed = true;
    if (nextGrid[idx].mine) {
      setGameOver(true);
      // reveal all
      setGrid(nextGrid.map(c => ({ ...c, revealed: true })));
    } else {
      setGrid(nextGrid);
    }
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    const link = `${window.location.origin}/apps?paste=${Math.random().toString(36).substring(7)}`;
    setGeneratedLink(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NavigationLayout activeTab="apps">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-emerald-400 flex items-center justify-center text-white font-black shadow-lg">
              <Grid className="w-5 h-5" />
            </span>
            Mini Apps
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            These apps are built right into ConnectNow so you can draw, watch videos, paste code snippets, or play games together without leaving the site.
          </p>
        </div>

        {/* Apps Grid (Screenshot 1 Layout Inspired) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mini Browser Card */}
          <Card className="bg-slate-900 border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-cyan-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Mini Browser</h3>
              </div>
              <p className="text-xs text-slate-400">
                Search the web or visit websites directly inside your chat session.
              </p>
            </div>
            <Button
              onClick={() => setActiveTool("browser")}
              variant="outline"
              className="mt-4 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 font-bold text-xs"
            >
              OPEN BROWSER
              <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </Button>
          </Card>

          {/* Minesweeper Card */}
          <Card className="bg-slate-900 border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-amber-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">🎮 Minesweeper 💣</h3>
              </div>
              <p className="text-xs text-slate-400">
                Can you achieve the highest score ever in this classic Minesweeper game? 🏆✨
              </p>
            </div>
            <Button
              onClick={() => setActiveTool("minesweeper")}
              variant="outline"
              className="mt-4 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-bold text-xs"
            >
              PLAY MINESWEEPER
            </Button>
          </Card>

          {/* Draw Together Card */}
          <Card className="bg-slate-900 border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-pink-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-white text-base">🎨 Draw Together 🖌️</h3>
              </div>
              <p className="text-xs text-slate-400">
                Sketch, doodle, and draw together live with your friends on an interactive canvas.
              </p>
            </div>
            <Button
              onClick={() => setActiveTool("draw")}
              variant="outline"
              className="mt-4 border-pink-500/40 text-pink-400 hover:bg-pink-500/10 font-bold text-xs"
            >
              OPEN DRAW
            </Button>
          </Card>

          {/* Watch Together Card */}
          <Card className="bg-slate-900 border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-purple-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Tv className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">👀 Watch Together 📺</h3>
              </div>
              <p className="text-xs text-slate-400">
                Watch YouTube videos and streams together with your group.
              </p>
            </div>
            <Button
              onClick={() => setActiveTool("watch")}
              variant="outline"
              className="mt-4 border-purple-500/40 text-purple-400 hover:bg-purple-500/10 font-bold text-xs"
            >
              OPEN WATCH
            </Button>
          </Card>

          {/* Group Video Meet Card */}
          <Card className="bg-slate-900 border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">🤝 Group Meet 💬</h3>
              </div>
              <p className="text-xs text-slate-400">
                Hold group video & audio call rooms with friends online.
              </p>
            </div>
            <Button
              onClick={() => setLocation("/groups")}
              variant="outline"
              className="mt-4 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs"
            >
              OPEN MEET
            </Button>
          </Card>

          {/* Paste Quest Card */}
          <Card className="bg-slate-900 border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 transition-all">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">📜 Paste Quest ✨</h3>
              </div>
              <p className="text-xs text-slate-400">
                Paste text or code into a unique shareable link and send to friends.
              </p>
            </div>
            <Button
              onClick={() => setActiveTool("paste")}
              variant="outline"
              className="mt-4 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 font-bold text-xs"
            >
              PASTE QUEST
            </Button>
          </Card>
        </div>

        {/* Modal Views for Mini Apps */}
        {activeTool !== "none" && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <Card className="w-full max-w-3xl bg-slate-900 border-slate-800 p-6 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setActiveTool("none")}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>

              {/* Tool 1: Mini Browser */}
              {activeTool === "browser" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    Mini Web Browser
                  </h2>
                  <div className="flex gap-2">
                    <Input
                      value={browserUrl}
                      onChange={e => setBrowserUrl(e.target.value)}
                      placeholder="Enter website URL..."
                      className="bg-slate-800 border-slate-700 text-white text-xs"
                    />
                    <Button
                      onClick={() => setCurrentIframeUrl(browserUrl)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                    >
                      GO
                    </Button>
                  </div>
                  <div className="w-full h-[450px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <iframe
                      src={currentIframeUrl}
                      className="w-full h-full border-none"
                      title="Mini Browser"
                    />
                  </div>
                </div>
              )}

              {/* Tool 2: Minesweeper */}
              {activeTool === "minesweeper" && (
                <div className="space-y-4 text-center">
                  <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-amber-400" />
                    Minesweeper Mini Game 💣
                  </h2>

                  {gameOver && (
                    <p className="text-rose-400 font-bold text-sm">💥 Boom! Game Over!</p>
                  )}

                  <div className="grid grid-cols-5 gap-2 max-w-[280px] mx-auto p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    {grid.map(cell => (
                      <button
                        key={cell.id}
                        onClick={() => handleCellClick(cell.id)}
                        className={`w-11 h-11 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                          cell.revealed
                            ? cell.mine
                              ? "bg-rose-600 text-white"
                              : "bg-slate-800 text-cyan-400"
                            : "bg-slate-700 hover:bg-slate-600 text-white"
                        }`}
                      >
                        {cell.revealed ? (cell.mine ? "💣" : cell.count || "") : "?"}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={initMinesweeper}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    RESET GAME
                  </Button>
                </div>
              )}

              {/* Tool 3: Draw Together */}
              {activeTool === "draw" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Palette className="w-5 h-5 text-pink-400" />
                      Draw Together
                    </h2>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearCanvas}
                        className="border-slate-700 text-slate-300 text-xs"
                      >
                        CLEAR
                      </Button>
                    </div>
                  </div>

                  <div className="w-full bg-red-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={400}
                      onMouseDown={handleDrawStart}
                      onMouseMove={handleDraw}
                      onMouseUp={handleDrawEnd}
                      onMouseLeave={handleDrawEnd}
                      className="cursor-crosshair w-full h-[400px]"
                    />
                  </div>
                </div>
              )}

              {/* Tool 4: Watch Together */}
              {activeTool === "watch" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Tv className="w-5 h-5 text-purple-400" />
                    Watch Together
                  </h2>
                  <div className="flex gap-2">
                    <Input
                      value={videoInput}
                      onChange={e => setVideoInput(e.target.value)}
                      placeholder="Paste YouTube embed URL..."
                      className="bg-slate-800 border-slate-700 text-white text-xs"
                    />
                    <Button
                      onClick={() => setVideoUrl(videoInput.trim() || videoUrl)}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                    >
                      LOAD
                    </Button>
                  </div>
                  <div className="w-full h-[380px] bg-black border border-slate-800 rounded-xl overflow-hidden">
                    <iframe
                      src={videoUrl}
                      className="w-full h-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Watch Together"
                    />
                  </div>
                </div>
              )}

              {/* Tool 5: Paste Quest */}
              {activeTool === "paste" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    Paste Quest ✨
                  </h2>
                  <p className="text-xs text-slate-400">
                    Paste text or code snippet below to create a unique link to send to friends.
                  </p>
                  <Textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder="Paste text here..."
                    className="bg-slate-800 border-slate-700 text-white text-xs h-40"
                  />
                  <Button
                    onClick={handlePasteSubmit}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs w-full"
                  >
                    GENERATE PASTE LINK
                  </Button>

                  {generatedLink && (
                    <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-cyan-400 truncate">{generatedLink}</span>
                      <Button
                        size="sm"
                        onClick={handleCopyLink}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </NavigationLayout>
  );
}

// Canvas.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { FaCameraRetro, FaBars, FaTimes } from "react-icons/fa";
import Tesseract from "tesseract.js";
import bgimg from "./BG.png";
import type { TeamPlayer, Team } from "./PlayerManagement";

interface Player {
  name: string;
  image: File | null;
}

type OcrWord = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

type OcrLine = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

const isThaiText = (text: string) => /[ก-ฮ]/.test(text);

const normalizeText = (s: string) =>
  (s ?? "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const isGarbageLine = (s: string) => {
  const lower = s.toLowerCase();
  return (
    lower.includes("mplus") ||
    lower.includes("volleyball") ||
    lower.includes("championship") ||
    lower.includes("engineer") ||
    lower.includes("u25") ||
    lower.includes("u21") ||
    lower.includes("cmu") ||
    lower === "staff"
  );
};

// Thai/Eng/mixed, keep simple + robust
const looksLikeName = (s: string) => {
  const t = normalizeText(s);

  if (!t) return false;
  if (isGarbageLine(t)) return false;

  // allow Thai/Eng/mixed + dot/space/hyphen/apostrophe
  if (!/^[0-9\s.'\-ก-ฮA-Za-z]+$/.test(t)) return false;

  // exclude pure numbers
  if (/^\d+$/.test(t)) return false;

  // Thai (2-30 chars)
  if (/[ก-ฮ]/.test(t) && t.length >= 2 && t.length <= 30) return true;

  // English patterns like: "T. Natthanan", "POPOR", "Newyear"
  if (/^[A-Za-z]{2,20}$/.test(t)) return true;
  if (/^[A-Z]\.\s*[A-Za-z]{2,}(\s+[A-Za-z]{2,}){0,2}$/.test(t)) return true;
  if (/^[A-Za-z]{2,}(\s+[A-Za-z]{2,}){0,2}$/.test(t)) return true;

  return false;
};

const uniqPush = (arr: string[], value: string) => {
  const v = normalizeText(value);
  if (!v) return;
  if (arr.some((x) => x.toLowerCase() === v.toLowerCase())) return;
  arr.push(v);
};

const getTeamFontSize = (text: string): string => {
  const base = 60;
  const len = text.trim().length;
  if (len > 16) return `${base - 20}px`;
  if (len > 12) return `${base - 12}px`;
  return `${base}px`;
};

// Preprocess image for better OCR: upscale + contrast + grayscale
const preprocessImageToDataUrl = (file: File, scale = 2): Promise<string> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas context");

        // Upscale + add contrast/brightness (helps on gradients)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.filter = "grayscale(100%) contrast(180%) brightness(110%)";
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
};

// Group OCR words into lines (more stable than Tesseract's line segmentation)
const wordsToLines = (words: OcrWord[]): OcrLine[] => {
  const cleanWords = words
    .map((w) => ({
      ...w,
      text: normalizeText(w.text),
    }))
    .filter((w) => w.text.length > 0)
    // drop digit-only tokens (jersey numbers)
    .filter((w) => !/^\d+$/.test(w.text))
    // drop tiny 1-char noise (optional; keep Thai single char? usually not a name)
    .filter((w) => w.text.length >= 2)
    // keep modest confidence; stylized fonts can be low
    .filter((w) => (w.confidence ?? 0) >= 30)
    .sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);

  if (cleanWords.length === 0) return [];

  const lines: OcrLine[] = [];
  let current: OcrWord[] = [];
  let currentY = cleanWords[0].bbox.y0;

  const yThreshold = 18; // tune if needed

  const flush = () => {
    if (current.length === 0) return;

    const text = current
      .map((w) => w.text)
      .join(" ")
      .trim();

    const x0 = Math.min(...current.map((w) => w.bbox.x0));
    const y0 = Math.min(...current.map((w) => w.bbox.y0));
    const x1 = Math.max(...current.map((w) => w.bbox.x1));
    const y1 = Math.max(...current.map((w) => w.bbox.y1));
    const conf =
      current.reduce((s, w) => s + (w.confidence ?? 0), 0) / current.length;

    lines.push({ text, confidence: conf, bbox: { x0, y0, x1, y1 } });
    current = [];
  };

  for (const w of cleanWords) {
    if (Math.abs(w.bbox.y0 - currentY) <= yThreshold) {
      current.push(w);
    } else {
      flush();
      currentY = w.bbox.y0;
      current.push(w);
    }
  }
  flush();

  return lines;
};

const extractNamesFromOcr = (
  lines: OcrLine[],
  imgW: number,
  imgH: number,
  maxCount: number
) => {
  // For “label under photo” layouts, names are medium size and not in the extreme top header.
  // Use VERY gentle spatial filtering so we don't delete valid lines.
  const candidates = lines
    .map((l) => ({
      ...l,
      text: normalizeText(l.text),
      w: l.bbox.x1 - l.bbox.x0,
      h: l.bbox.y1 - l.bbox.y0,
    }))
    .filter((l) => l.text.length >= 2 && l.text.length <= 30)
    .filter((l) => l.confidence >= 25)
    // remove huge banner lines
    .filter((l) => l.w < imgW * 0.9 && l.h < imgH * 0.12)
    // ignore very top header area (less aggressive than before)
    .filter((l) => l.bbox.y0 > imgH * 0.08)
    .filter((l) => looksLikeName(l.text))
    .sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);

  const names: string[] = [];
  for (const c of candidates) {
    // clean out junk tokens that sneak in
    const cleaned = c.text
      .replace(/\b(staff|u25|u21|cmu)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) continue;
    if (isGarbageLine(cleaned)) continue;

    // If line became multi-word weirdly, keep it (some Thai names have spaces),
    // but avoid extremely long phrases.
    if (cleaned.length > 30) continue;

    uniqPush(names, cleaned);
    if (names.length >= maxCount) break;
  }

  return names;
};

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: 7 }, () => ({ name: "", image: null }))
  );

  const [teamName, setTeamName] = useState("");
  const [savedPlayers, setSavedPlayers] = useState<TeamPlayer[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string>("");
  const [showTeamMenu, setShowTeamMenu] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);

  // Load saved team and players from localStorage
  useEffect(() => {
    // Try new multi-team format first
    const allTeamsData = localStorage.getItem("allTeams");
    const savedActiveTeamId = localStorage.getItem("activeTeamId");

    if (allTeamsData) {
      try {
        const teams = JSON.parse(allTeamsData);
        setAllTeams(teams);

        const teamIdToLoad = savedActiveTeamId || teams[0]?.id;
        if (teamIdToLoad) {
          const activeTeam = teams.find((t: Team) => t.id === teamIdToLoad);
          if (activeTeam) {
            setActiveTeamId(activeTeam.id);
            setTeamName(activeTeam.name);
            setSavedPlayers(activeTeam.players);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load teams:", e);
      }
    }

    // Fallback to legacy format
    const savedTeamName = localStorage.getItem("teamName");
    const savedPlayersData = localStorage.getItem("teamPlayers");

    if (savedTeamName) setTeamName(savedTeamName);
    if (savedPlayersData) {
      try {
        setSavedPlayers(JSON.parse(savedPlayersData));
      } catch (e) {
        console.error("Failed to load players:", e);
      }
    }
  }, []);

  const switchTeam = (teamId: string) => {
    const team = allTeams.find((t) => t.id === teamId);
    if (team) {
      setActiveTeamId(team.id);
      setTeamName(team.name);
      setSavedPlayers(team.players);
      localStorage.setItem("activeTeamId", team.id);
      localStorage.setItem("teamName", team.name);
      localStorage.setItem("teamPlayers", JSON.stringify(team.players));
      setShowTeamMenu(false);
    }
  };

  // Object URLs for player photo previews
  const playerImageUrls = useMemo(() => {
    return players.map((p) => (p.image ? URL.createObjectURL(p.image) : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.map((p) => p.image)]);

  useEffect(() => {
    return () => {
      playerImageUrls.forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [playerImageUrls]);

  const handleImageUpload = (index: number, file: File | null) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], image: file };
      return updated;
    });
  };

  const handleNameChange = (index: number, value: string) => {
    setPlayers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: value };
      return updated;
    });
  };

  const handlePlayerSelect = (index: number, playerId: string) => {
    const selectedPlayer = savedPlayers.find((p) => p.id === playerId);
    if (selectedPlayer) {
      handleNameChange(index, selectedPlayer.name);
    }
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, {
        width: 1440,
        height: 1080,
        pixelRatio: 1,
      });
      saveAs(dataUrl, "lineup.png");
    } catch (err) {
      console.error("Error exporting image:", err);
      alert("Export failed");
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleImageUpload(index, file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleBulkImageUpload = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please upload a valid image file");
      return;
    }

    setIsProcessing(true);
    setOcrProgress(0);

    try {
      // Preprocess improves results on gradients + stylized fonts
      const processed = await preprocessImageToDataUrl(file, 2);

      // Measure processed image size (used for filtering)
      const img = new Image();
      img.src = processed;
      await img.decode();
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      // Run OCR (Thai + English)
      // NOTE: Thai needs tha.traineddata available in your build; see note below.
      const result = await Tesseract.recognize(processed, "tha+eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
        // Try AUTO first; better for screenshots like yours
        tessedit_pageseg_mode: (Tesseract as any).PSM?.AUTO ?? 3,
        preserve_interword_spaces: "1",
      });

      // Build from words (more reliable)
      const rawWords = (result.data.words ?? []) as any[];
      const words: OcrWord[] = rawWords
        .map((w) => ({
          text: w.text ?? "",
          confidence: Number(w.confidence ?? w.conf ?? 0),
          bbox: w.bbox,
        }))
        .filter((w) => w.bbox && typeof w.bbox.x0 === "number");

      const lines = wordsToLines(words);
      let names = extractNamesFromOcr(lines, W, H, players.length);

      // Fallback: if still empty, run a second pass with SPARSE_TEXT
      if (names.length === 0) {
        const result2 = await Tesseract.recognize(processed, "tha+eng", {
          logger: (m: any) => {
            if (m.status === "recognizing text") {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
          tessedit_pageseg_mode: (Tesseract as any).PSM?.SPARSE_TEXT ?? 11,
          preserve_interword_spaces: "1",
        });

        const rawWords2 = (result2.data.words ?? []) as any[];
        const words2: OcrWord[] = rawWords2
          .map((w) => ({
            text: w.text ?? "",
            confidence: Number(w.confidence ?? w.conf ?? 0),
            bbox: w.bbox,
          }))
          .filter((w) => w.bbox && typeof w.bbox.x0 === "number");

        const lines2 = wordsToLines(words2);
        names = extractNamesFromOcr(lines2, W, H, players.length);
      }

      if (names.length === 0) {
        alert(
          "Could not detect names.\nTry: higher-res screenshot, less compression, or ensure Thai traineddata is loaded."
        );
        return;
      }

      setPlayers((prev) =>
        prev.map((p, i) => ({
          ...p,
          name: names[i] ?? p.name,
        }))
      );

      alert(`Extracted ${names.length} name(s) ✅`);
    } catch (error) {
      console.error("OCR Error:", error);
      alert(
        "OCR failed. If Thai names don't work, you may be missing tha.traineddata."
      );
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  return (
    <div className="p-5 bg-slate-600 min-h-screen relative">
      {!isPreview && (
        <div className="text-center mb-4 space-y-4">
          {/* Team Name with Dropdown */}
          <div className="relative w-full max-w-md mx-auto">
            {allTeams.length > 0 ? (
              <select
                value={activeTeamId}
                onChange={(e) => switchTeam(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-center font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
              >
                {allTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.players.length} players)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Team Name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            )}
          </div>
        </div>
      )}

      {isPreview ? (
        <div
          ref={canvasRef}
          className="relative mx-auto"
          style={{
            width: "1440px",
            height: "1080px",
            backgroundImage: `url(${bgimg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "block",
            margin: "0 auto",
            position: "relative",
          }}
        >
          <div
            className="absolute"
            style={{
              left: "0",
              top: "250px",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              fontSize: getTeamFontSize(teamName),
              fontWeight: "bold",
              color: "white",
              fontFamily: isThaiText(teamName)
                ? "'Chakra Petch', sans-serif"
                : "'Sports World', sans-serif",
            }}
          >
            {teamName || "Team Name"}
          </div>

          <div className="relative ml-3">
            {[
              { idx: 3, left: 450, top: 420 },
              { idx: 2, left: 635, top: 420 },
              { idx: 1, left: 820, top: 420 },
              { idx: 4, left: 450, top: 670 },
              { idx: 5, left: 630, top: 670 },
              { idx: 0, left: 820, top: 670 },
              { idx: 6, left: 990, top: 750 },
            ].map((p) => {
              const pl = players[p.idx];
              const imgUrl = playerImageUrls[p.idx];
              const fontFamily = isThaiText(pl.name)
                ? "Noto Sans Thai, sans-serif"
                : "Bebas Neue, sans-serif";

              return (
                <div
                  key={p.idx}
                  className="relative border-2 border-solid border-gray-300 rounded-lg p-2 bg-white"
                  style={{
                    position: "absolute",
                    left: `${p.left}px`,
                    top: `${p.top}px`,
                    width: "150px",
                    height: "220px",
                  }}
                >
                  <div className="w-full h-4/4 flex items-center justify-center rounded-lg overflow-hidden">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={`Player ${p.idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        className="text-gray-600 text-center text-6xl leading-none"
                        style={{ fontFamily, fontWeight: 600 }}
                      >
                        {pl.name}
                      </span>
                    )}
                  </div>

                  <div
                    className="mt-2 text-center text-gray-800 text-lg font-semibold"
                    style={{ fontFamily, fontWeight: 400 }}
                  >
                    {!imgUrl ? "" : pl.name || `Player ${p.idx + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="relative mx-auto bg-gray-200 border-2 border-gray-400 rounded-lg"
          style={{ width: "1440px", height: "1080px" }}
        >
          <div className="grid grid-cols-3 gap-4 px-20 py-32">
            {players.map((player, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className="flex flex-col items-center justify-center border-2 border-solid border-gray-400 p-2 rounded"
                  style={{ width: "150px", height: "280px" }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {player.image ? (
                    <div className="w-full h-full flex items-center justify-center">
                      {playerImageUrls[index] && (
                        <img
                          src={playerImageUrls[index] as string}
                          alt={`Player ${index + 1}`}
                          className="w-full h-full object-contain rounded-md"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-md">
                      <label
                        htmlFor={`file-upload-${index}`}
                        className="cursor-pointer flex flex-col items-center text-gray-400 text-center"
                      >
                        <FaCameraRetro className="w-10 h-10 text-gray-400" />
                        <span className="mt-2">Click or Drop</span>
                      </label>
                      <input
                        id={`file-upload-${index}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(index, e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                    </div>
                  )}

                  <div className="flex flex-col items-center mt-2 w-full space-y-2">
                    {savedPlayers.length > 0 && (
                      <select
                        onChange={(e) =>
                          handlePlayerSelect(index, e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded text-center w-full bg-blue-50"
                      >
                        <option value="">Select Player</option>
                        {savedPlayers.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.jerseyNumber ? `#${sp.jerseyNumber} ` : ""}
                            {sp.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      placeholder={`Player ${index + 1} Name`}
                      value={player.name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      className="p-2 border border-gray-300 rounded text-center w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center mt-4">
        {isPreview ? (
          <>
            <button
              onClick={() => setIsPreview(false)}
              className="bg-yellow-500 text-white py-2 px-4 rounded"
            >
              Back to Edit
            </button>
            <button
              onClick={handleExport}
              className="bg-green-500 text-white py-2 px-4 ml-4 rounded"
            >
              Export to PNG
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsPreview(true)}
            className="bg-blue-500 text-white py-2 px-6 rounded mt-10"
            style={{ position: "relative", zIndex: 10 }}
          >
            Preview
          </button>
        )}
      </div>
    </div>
  );
};

export default Canvas;

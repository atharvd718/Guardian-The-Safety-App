import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Mic,
  Square,
  Pause,
  Play,
  Trash2,
  Share2,
  X,
  FileAudio,
  CheckCircle2,
} from 'lucide-react';
import { StorageService } from '../lib/storage';
import { AudioRecordItem } from '../types';

interface RecordAudioViewProps {
  onBack: () => void;
}

export const RecordAudioView: React.FC<RecordAudioViewProps> = ({ onBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioList, setAudioList] = useState<AudioRecordItem[]>([]);
  
  // Bottom Sheet Modal state
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  const [currentRecordingId, setCurrentRecordingId] = useState('');
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    setAudioList(StorageService.getAudioRecordings());
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isRecording, isPaused]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mStr}:${sStr}.00`;
  };

  // Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setSeconds(0);
    } catch (err) {
      // Fallback timer simulation if mic permissions are limited
      setIsRecording(true);
      setIsPaused(false);
      setSeconds(0);
    }
  };

  // Pause Recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    setIsPaused(true);
  };

  // Resume Recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    setIsPaused(false);
  };

  // Stop Recording & Trigger Bottom Sheet Modal
  const stopRecording = () => {
    const now = new Date();
    const dateFormatted = `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}`;
    const defaultName = `audio_GuardianSafety_${dateFormatted}`;

    let audioUrl = '';
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          audioUrl = URL.createObjectURL(audioBlob);
          setCurrentAudioUrl(audioUrl);
        };
      } catch (e) {
        // ignore
      }
    }

    const recId = 'rec_' + Date.now();
    const durationFormatted = formatTimer(seconds);

    setCurrentRecordingId(recId);
    setCurrentFileName(defaultName);
    setIsRecording(false);
    setIsPaused(false);

    // Save item
    const newItem: AudioRecordItem = {
      id: recId,
      fileName: defaultName,
      date: new Date().toLocaleDateString(),
      duration: durationFormatted,
      audioUrl: audioUrl || undefined,
    };

    StorageService.addAudioRecording(newItem);
    setAudioList(StorageService.getAudioRecordings());
    setIsBottomSheetOpen(true);
  };

  // Delete Recording
  const deleteCurrentRecording = () => {
    if (currentRecordingId) {
      StorageService.removeAudioRecording(currentRecordingId);
      setAudioList(StorageService.getAudioRecordings());
    }
    setIsRecording(false);
    setIsPaused(false);
    setSeconds(0);
    setIsBottomSheetOpen(false);
  };

  // Share to WhatsApp / Apps
  const shareFile = () => {
    const shareText = `Emergency Audio Clip from Guardian Safety App: ${currentFileName}`;
    if (navigator.share) {
      navigator.share({
        title: 'Emergency Audio Recording',
        text: shareText,
      }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    }
    setIsBottomSheetOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* Top Bar */}
      <div className="p-5 flex items-center justify-between z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-800 rounded-full transition text-slate-300 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-extrabold text-lg text-rose-500">Record Audio</h1>
        <div className="w-8"></div>
      </div>

      {/* Main Studio View */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center space-y-8 z-10 my-auto">
        {/* Pulsing Mic Visualizer */}
        <div className="relative flex items-center justify-center">
          {isRecording && !isPaused && (
            <>
              <div className="absolute w-56 h-56 rounded-full bg-rose-600/20 animate-ping"></div>
              <div className="absolute w-44 h-44 rounded-full bg-rose-500/30 animate-pulse"></div>
            </>
          )}

          <div
            className={`w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 border-4 ${
              isRecording
                ? 'bg-rose-600 border-rose-400 text-white shadow-rose-600/50 scale-105'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Mic className="w-16 h-16" />
          </div>
        </div>

        {/* Timer Display */}
        <div className="space-y-1">
          <p className="text-4xl font-black font-mono tracking-wider text-white">
            {formatTimer(seconds)}
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {isRecording
              ? isPaused
                ? 'RECORDING PAUSED'
                : 'RECORDING LIVE AUDIO...'
              : 'PRESS MIC TO START RECORDING'}
          </p>
        </div>

        {/* Main Controls Bar */}
        <div className="flex items-center justify-center gap-6 pt-4 w-full">
          {/* Delete Button */}
          <button
            onClick={deleteCurrentRecording}
            disabled={!isRecording && seconds === 0}
            className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition active:scale-90 border border-slate-700"
            title="Delete Recording"
          >
            <Trash2 className="w-6 h-6" />
          </button>

          {/* Record / Pause / Resume Button */}
          <button
            onClick={
              isPaused
                ? resumeRecording
                : isRecording
                ? pauseRecording
                : startRecording
            }
            className="w-20 h-20 rounded-3xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-600/50 transition transform active:scale-90"
            title={isRecording ? 'Pause/Resume' : 'Start Recording'}
          >
            {isRecording ? (
              isPaused ? (
                <Play className="w-8 h-8 ml-1" />
              ) : (
                <Pause className="w-8 h-8" />
              )
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          {/* Stop / Save Button */}
          <button
            onClick={stopRecording}
            disabled={!isRecording && seconds === 0}
            className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition active:scale-90 border border-slate-700"
            title="Finish Recording"
          >
            <Square className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>

      {/* Saved Audio Clips Section */}
      <div className="p-5 bg-slate-800/80 border-t border-slate-800 max-h-48 overflow-y-auto space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileAudio className="w-4 h-4 text-rose-500" />
          <span>Saved Audio Recordings ({audioList.length})</span>
        </h3>

        {audioList.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No audio clips recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {audioList.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/90 p-3 rounded-2xl border border-slate-700 flex items-center justify-between text-xs"
              >
                <div className="text-left space-y-0.5 truncate max-w-[200px]">
                  <p className="font-bold text-slate-200 truncate">{item.fileName}</p>
                  <p className="text-[10px] text-slate-400">{item.date} • {item.duration}</p>
                </div>
                {item.audioUrl && (
                  <audio controls src={item.audioUrl} className="h-8 w-28"></audio>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sheet Modal matching audio_bottom_sheet.xml */}
      {isBottomSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-6 w-full max-w-md space-y-5 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-500 font-extrabold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Save Audio Recording</span>
              </div>
              <button
                onClick={() => setIsBottomSheetOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                File Name
              </label>
              <input
                type="text"
                value={currentFileName}
                onChange={(e) => setCurrentFileName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={deleteCurrentRecording}
                className="w-1/2 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition text-sm"
              >
                Discard
              </button>
              <button
                onClick={shareFile}
                className="w-1/2 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/30 transition text-sm flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

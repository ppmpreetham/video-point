"use client"

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function VideoPresenter() {
  const videoRef = useRef(null);
  const reverseVideoRef = useRef(null);
  const timelineRef = useRef(null);
  const playheadRef = useRef(null);
  const [keyframes, setKeyframes] = useState([]);
  const [currentKeyframe, setCurrentKeyframe] = useState(0);
  const [videoFile, setVideoFile] = useState(null);
  const [reverseVideoFile, setReverseVideoFile] = useState(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingKeyframe, setDraggingKeyframe] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(URL.createObjectURL(file));
    }
  };

  const handleReverseFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReverseVideoFile(URL.createObjectURL(file));
    }
  };

  const addKeyframe = () => {
    if (videoRef.current) {
      setKeyframes([...keyframes, videoRef.current.currentTime].sort((a, b) => a - b));
    }
  };

  const playUntilNextKeyframe = (forward = true) => {
    if (videoRef.current && (!forward && reverseVideoRef.current || forward)) {
      if (keyframes.length === 0) return;

      let nextIndex = forward 
        ? keyframes.findIndex(kf => kf > videoRef.current.currentTime) 
        : [...keyframes].reverse().findIndex(kf => kf < videoRef.current.currentTime);

      if (nextIndex === -1) {
        videoRef.current.currentTime = forward ? videoRef.current.duration : 0;
        setCurrentKeyframe(forward ? keyframes.length - 1 : 0);
        return;
      }

      const nextTime = keyframes[forward ? nextIndex : keyframes.length - 1 - nextIndex];
      
      if (!forward && reverseVideoRef.current) {
        // Use reverse video for backward playback
        const currentVideo = videoRef.current;
        const reverseVideo = reverseVideoRef.current;
        
        // Sync reverse video position
        const reversedTime = currentVideo.duration - currentVideo.currentTime;
        reverseVideo.currentTime = reversedTime;
        
        // Hide main video, show reverse video
        currentVideo.style.display = 'none';
        reverseVideo.style.display = 'block';
        
        reverseVideo.play();
        const checkFrame = setInterval(() => {
          if (reverseVideo.currentTime >= (reverseVideo.duration - nextTime)) {
            reverseVideo.pause();
            clearInterval(checkFrame);
            
            // Switch back to main video
            currentVideo.currentTime = nextTime;
            currentVideo.style.display = 'block';
            reverseVideo.style.display = 'none';
            
            setCurrentKeyframe(nextIndex);
          }
        }, 10);
      } else if (!forward) {
        // Fallback to frame-by-frame reverse if no reverse video
        videoRef.current.pause();
        const smoothReverse = () => {
          if (videoRef.current.currentTime <= nextTime) {
            videoRef.current.pause();
            setCurrentKeyframe(nextIndex);
            return;
          }
          videoRef.current.currentTime -= 0.05;
          requestAnimationFrame(smoothReverse);
        };
        smoothReverse();
      } else {
        videoRef.current.pause();
        videoRef.current.play();
        const checkFrame = setInterval(() => {
          if (videoRef.current.currentTime >= nextTime) {
            videoRef.current.pause();
            clearInterval(checkFrame);
            setCurrentKeyframe(nextIndex);
          }
        }, 10);
      }
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      playUntilNextKeyframe(true);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      playUntilNextKeyframe(false);
    } else if (event.key === 'Escape') {
      setIsPresenting(false);
    }
  };

  const enterFullScreen = () => {
    const presentationContainer = document.getElementById('presentation-container');
    if (presentationContainer && presentationContainer.requestFullscreen) {
      presentationContainer.requestFullscreen();
    }
  };

  const handlePlayheadMove = (e) => {
    if (isDragging && videoRef.current && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const time = (pos / rect.width) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      
      if (playheadRef.current) {
        playheadRef.current.style.left = `${pos}px`;
      }
    }
  };

  const handleKeyframeMove = (e) => {
    if (draggingKeyframe !== null && timelineRef.current && videoRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const time = (pos / rect.width) * videoRef.current.duration;
      const newKeyframes = [...keyframes];
      newKeyframes[draggingKeyframe] = time;
      setKeyframes(newKeyframes.sort((a, b) => a - b));
    }
  };

  const updatePlayheadPosition = () => {
    if (videoRef.current && playheadRef.current && timelineRef.current) {
      const pos = (videoRef.current.currentTime / videoRef.current.duration) * timelineRef.current.offsetWidth;
      playheadRef.current.style.left = `${pos}px`;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    if (isPresenting) {
      enterFullScreen();
      document.addEventListener('keydown', handleKeyPress);
    } else {
      document.removeEventListener('keydown', handleKeyPress);
    }
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPresenting]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        handlePlayheadMove(e);
      }
      if (draggingKeyframe !== null) {
        handleKeyframeMove(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggingKeyframe(null);
    };

    if (isDragging || draggingKeyframe !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggingKeyframe]);

  useEffect(() => {
    const interval = setInterval(updatePlayheadPosition, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`p-4 flex flex-col items-center ${isPresenting ? 'fixed inset-0 bg-black' : ''}`}>
      {!isPresenting && (
        <div className="w-full max-w-2xl space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Main Video:</label>
            <input type="file" accept="video/*" onChange={handleFileChange} className="mb-4" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Reverse Video (optional):</label>
            <input type="file" accept="video/*" onChange={handleReverseFileChange} className="mb-4" />
          </div>
        </div>
      )}
      {videoFile && (
        <div id="presentation-container" className="w-full relative">
          <video 
            ref={videoRef} 
            src={videoFile} 
            controls={!isPresenting} 
            className="w-full mb-4" 
          />
          {reverseVideoFile && (
            <video
              ref={reverseVideoRef}
              src={reverseVideoFile}
              className="w-full mb-4 hidden absolute top-0 left-0"
            />
          )}
          {isPresenting && (
            <>
              <button 
                onClick={() => playUntilNextKeyframe(false)}
                className="fixed left-4 top-1/2 transform -translate-y-1/2 p-4 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={() => playUntilNextKeyframe(true)}
                className="fixed right-4 top-1/2 transform -translate-y-1/2 p-4 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
          {!isPresenting && (
            <div 
              ref={timelineRef} 
              className="relative w-full h-8 bg-gray-200 rounded flex items-center"
              onMouseDown={(e) => {
                const rect = timelineRef.current.getBoundingClientRect();
                const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const time = (pos / rect.width) * videoRef.current.duration;
                videoRef.current.currentTime = time;
                setIsDragging(true);
              }}
            >
              {keyframes.map((time, index) => (
                <div
                  key={index}
                  className="absolute w-4 h-4 bg-blue-500 transform rotate-45 cursor-pointer"
                  style={{ left: `${(time / videoRef.current?.duration || 0) * 100}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingKeyframe(index);
                  }}
                ></div>
              ))}
              <div
                ref={playheadRef}
                className="absolute w-2 h-8 bg-red-500 cursor-pointer"
                style={{ left: '0px', transform: 'translateX(-50%)' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDragging(true);
                }}
              ></div>
              <div className="absolute w-full h-full flex justify-between items-center px-2">
                {Array.from({ length: 11 }).map((_, index) => (
                  <span key={index} className="text-xs text-gray-700">
                    {videoRef.current ? formatTime((index / 10) * videoRef.current.duration) : '0:00'}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!isPresenting && (
            <button onClick={addKeyframe} className="p-2 bg-blue-500 text-white rounded mt-2">
              Add Keyframe
            </button>
          )}
          <div className="flex gap-4 mt-4">
            <button onClick={() => playUntilNextKeyframe(false)} className="p-2 bg-gray-500 text-white rounded">
              Previous
            </button>
            <button onClick={() => playUntilNextKeyframe(true)} className="p-2 bg-green-500 text-white rounded">
              Next
            </button>
          </div>
          <button onClick={() => setIsPresenting(!isPresenting)} className="p-2 bg-red-500 text-white rounded mt-4">
            {isPresenting ? 'Exit Presentation' : 'Enter Presentation'}
          </button>
        </div>
      )}
    </div>
  );
}
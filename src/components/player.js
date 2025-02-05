"use client"

import { useRef, useState, useEffect } from 'react';

export default function VideoPresenter() {
  const videoRef = useRef(null);
  const [keyframes, setKeyframes] = useState([]);
  const [currentKeyframe, setCurrentKeyframe] = useState(0);
  const [videoFile, setVideoFile] = useState(null);
  const [isPresenting, setIsPresenting] = useState(false);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(URL.createObjectURL(file));
    }
  };

  const addKeyframe = () => {
    if (videoRef.current) {
      setKeyframes([...keyframes, videoRef.current.currentTime].sort((a, b) => a - b));
    }
  };

  const playUntilNextKeyframe = (forward = true) => {
    if (videoRef.current) {
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
      
      if (!forward) {
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
    }
  };

  const enterFullScreen = () => {
    if (videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
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

  return (
    <div className={`p-4 flex flex-col items-center ${isPresenting ? 'fixed inset-0 bg-black' : ''}`}>
      {!isPresenting && <input type="file" accept="video/*" onChange={handleFileChange} className="mb-4" />}
      {videoFile && (
        <div className="w-full max-w-2xl">
          <video ref={videoRef} src={videoFile} controls={!isPresenting} className="w-full mb-4" />
          {!isPresenting && (
            <div className="relative w-full h-8 bg-gray-200 rounded flex items-center">
              {keyframes.map((time, index) => (
                <div
                  key={index}
                  className="absolute w-4 h-4 bg-blue-500 transform rotate-45"
                  style={{ left: `${(time / videoRef.current.duration) * 100}%` }}
                ></div>
              ))}
            </div>
          )}
          {!isPresenting && (
            <button onClick={addKeyframe} className="p-2 bg-blue-500 text-white rounded mt-2">Add Keyframe</button>
          )}
          <div className="flex gap-4 mt-4">
            <button onClick={() => playUntilNextKeyframe(false)} className="p-2 bg-gray-500 text-white rounded">Previous</button>
            <button onClick={() => playUntilNextKeyframe(true)} className="p-2 bg-green-500 text-white rounded">Next</button>
          </div>
          <button onClick={() => setIsPresenting(!isPresenting)} className="p-2 bg-red-500 text-white rounded mt-4">
            {isPresenting ? 'Exit Presentation' : 'Enter Presentation'}
          </button>
        </div>
      )}
    </div>
  );
}

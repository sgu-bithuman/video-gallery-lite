import React, { useState, useEffect, useRef, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import './VideoGallery.css';

const VideoItem = React.memo(({ video, index, removeVideo, videoRef }) => {
  return (
    <div className="video-item">
      <video 
        ref={videoRef}
        src={video.url} 
        autoPlay 
        loop 
        muted 
        controls
      >
        Your browser does not support the video tag.
      </video>
      <button onClick={() => removeVideo(index)} className="remove-btn" aria-label="Remove video"></button>
    </div>
  );
});

function VideoGallery() {
  const [videos, setVideos] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [layout, setLayout] = useState('masonry');
  const [showLayoutOptions, setShowLayoutOptions] = useState(false);
  const fileInputRef = useRef(null);
  const layoutOptionsRef = useRef(null);
  const videoRefs = useRef({});
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [dropZoneExpanded, setDropZoneExpanded] = useState(true);
  const dropZoneRef = useRef(null);
  const [masonryColumns, setMasonryColumns] = useState(0); // 0 means adaptive
  const [splitScreenColumns, setSplitScreenColumns] = useState(2);
  const [polaroidColumns, setPolaroidColumns] = useState(0); // 0 means adaptive

  useEffect(() => {
    const storedVideos = JSON.parse(localStorage.getItem('videoGallery') || '[]');
    setVideos(storedVideos);
    setDropZoneExpanded(storedVideos.length === 0);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (layoutOptionsRef.current && !layoutOptionsRef.current.contains(event.target)) {
        setShowLayoutOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (videos.length > 0) {
      setDropZoneExpanded(false);
    }
  }, [videos]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropZoneRef.current && !dropZoneRef.current.contains(event.target)) {
        setDropZoneExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFiles = (files) => {
    const newVideos = [...videos];
    
    for (let file of files) {
      if (file.type.startsWith('video/')) {
        newVideos.push({
          name: file.name,
          url: URL.createObjectURL(file)
        });
      }
    }
    
    setVideos(newVideos);
    localStorage.setItem('videoGallery', JSON.stringify(newVideos));
  };

  const handleFileInput = (e) => {
    handleFiles(e.target.files);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const removeVideo = (index) => {
    const newVideos = videos.filter((_, i) => i !== index);
    setVideos(newVideos);
    localStorage.setItem('videoGallery', JSON.stringify(newVideos));
    
    // Adjust focusedIndex if necessary
    if (newVideos.length === 0) {
      setFocusedIndex(0);
    } else if (index <= focusedIndex && focusedIndex > 0) {
      setFocusedIndex(focusedIndex - 1);
    }
  };

  const breakpointColumnsObj = {
    default: masonryColumns || 4,
    1100: masonryColumns || 3,
    700: masonryColumns || 2,
    500: masonryColumns || 1
  };

  const truncateFilename = (filename, maxLength = 20) => {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop();
    const nameWithoutExtension = filename.slice(0, filename.lastIndexOf('.'));
    const truncatedName = nameWithoutExtension.slice(0, maxLength - 3 - extension.length);
    return `${truncatedName}...${extension}`;
  };

  const handleKeyDown = useCallback((e) => {
    if (['0', '1', '2', '3', '4'].includes(e.key)) {
      const columnCount = parseInt(e.key);
      switch (layout) {
        case 'masonry':
          setMasonryColumns(columnCount);
          break;
        case 'split-screen':
          setSplitScreenColumns(columnCount === 0 ? 2 : columnCount);
          break;
        case 'stacked-polaroids':
          setPolaroidColumns(columnCount);
          break;
        case 'circle':
          // Adjust circle layout columns if needed
          break;
        default:
          break;
      }
    } else if (layout === 'slideshow') {
      if (e.key === 'ArrowLeft') {
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : videos.length - 1));
      } else if (e.key === 'ArrowRight') {
        setFocusedIndex((prev) => (prev < videos.length - 1 ? prev + 1 : 0));
      }
    }
  }, [layout, videos.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const renderVideos = useCallback(() => {
    switch (layout) {
      case 'split-screen':
        return (
          <div className={`video-grid split-screen columns-${splitScreenColumns}`}>
            {Array.from({ length: splitScreenColumns }).map((_, columnIndex) => (
              <div key={columnIndex} className="split-column">
                {videos
                  .filter((_, index) => index % splitScreenColumns === columnIndex)
                  .map((video, index) => (
                    <VideoItem
                      key={video.url}
                      video={video}
                      index={index * splitScreenColumns + columnIndex}
                      removeVideo={removeVideo}
                      videoRef={el => {
                        if (el) videoRefs.current[video.url] = el;
                      }}
                    />
                  ))}
              </div>
            ))}
          </div>
        );
      case 'slideshow':
        return (
          <div className="video-grid slideshow">
            {videos.length > 0 ? (
              <>
                <div className="focused-video-container">
                  <button 
                    className="nav-arrow left-arrow" 
                    onClick={() => setFocusedIndex((prev) => (prev > 0 ? prev - 1 : videos.length - 1))}
                  >
                    &#8249;
                  </button>
                  <VideoItem 
                    video={videos[focusedIndex]} 
                    index={focusedIndex} 
                    removeVideo={removeVideo} 
                    videoRef={el => {
                      if (el) videoRefs.current[videos[focusedIndex].url] = el;
                    }}
                  />
                  <button 
                    className="nav-arrow right-arrow" 
                    onClick={() => setFocusedIndex((prev) => (prev < videos.length - 1 ? prev + 1 : 0))}
                  >
                    &#8250;
                  </button>
                </div>
                <div className="video-thumbnails-container">
                  <div 
                    className="video-thumbnails"
                    style={{
                      transform: `translateX(calc(-${focusedIndex * 210}px + 50% - 105px))`,
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    {videos.map((video, index) => (
                      <div 
                        key={video.url}
                        className={`thumbnail ${index === focusedIndex ? 'active' : ''}`}
                        onClick={() => setFocusedIndex(index)}
                      >
                        <video src={video.url} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="no-videos-message">
                <p>No videos to display. Add some videos to start the slideshow!</p>
              </div>
            )}
          </div>
        );
      case 'circle':
        return (
          <div className="video-grid circle">
            {videos.map((video, index) => {
              const sizeFactor = 0.5 + Math.random(); // Random number between 0.5 and 1.5
              const size = 400 * sizeFactor; // Base size of 400px
              return (
                <div 
                  key={video.url} 
                  className="circle-item"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                  }}
                >
                  <video
                    src={video.url}
                    loop
                    muted
                    autoPlay
                    onClick={() => {
                      const videoElement = videoRefs.current[video.url];
                      if (videoElement.paused) {
                        videoElement.play();
                      } else {
                        videoElement.pause();
                      }
                    }}
                    ref={el => {
                      if (el) videoRefs.current[video.url] = el;
                    }}
                  />
                  <button onClick={() => removeVideo(index)} className="remove-btn" aria-label="Remove video"></button>
                </div>
              );
            })}
          </div>
        );
      case 'masonry':
      default:
        return (
          <Masonry
            breakpointCols={masonryColumns || breakpointColumnsObj}
            className={`video-grid masonry columns-${masonryColumns || 'adaptive'}`}
            columnClassName="video-grid_column"
          >
            {videos.map((video, index) => (
              <VideoItem 
                key={video.url} 
                video={video} 
                index={index} 
                removeVideo={removeVideo} 
                videoRef={el => {
                  if (el) videoRefs.current[video.url] = el;
                }}
              />
            ))}
          </Masonry>
        );
    }
  }, [videos, layout, removeVideo, focusedIndex, masonryColumns, splitScreenColumns, polaroidColumns]);

  const handleLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout);
    setShowLayoutOptions(false);
    // Preserve video states
    Object.values(videoRefs.current).forEach(videoElement => {
      if (videoElement) {
        const wasPlaying = !videoElement.paused;
        const currentTime = videoElement.currentTime;
        requestAnimationFrame(() => {
          videoElement.currentTime = currentTime;
          if (wasPlaying) videoElement.play().catch(() => {});
        });
      }
    });
  }, []);

  const toggleDropZone = () => {
    if (videos.length > 0) {
      setDropZoneExpanded(!dropZoneExpanded);
    }
  };

  return (
    <div className="video-gallery">
      <div 
        ref={dropZoneRef}
        className={`drop-zone-container ${dropZoneExpanded || videos.length === 0 ? 'expanded' : ''} ${videos.length === 0 ? 'no-videos' : ''}`}
      >
        {videos.length > 0 && (
          <div className="drop-zone-toggle" onClick={toggleDropZone}>
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="drop-zone-content">
            <svg className="upload-icon-large" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="drop-text">Drag & drop files here</p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept="video/*"
            style={{ display: 'none' }}
            multiple
          />
        </div>
      </div>
      {renderVideos()}
      {videos.length > 0 && (
        <div className={`layout-button ${showLayoutOptions ? 'active' : ''}`}>
          <button onClick={() => setShowLayoutOptions(!showLayoutOptions)} className="layout-toggle" aria-label="Change layout">
            <svg className="layout-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <div 
            ref={layoutOptionsRef}
            className="layout-options"
            onMouseLeave={() => setShowLayoutOptions(false)}
          >
            <button onClick={() => handleLayoutChange('masonry')} className={layout === 'masonry' ? 'active' : ''}>
              <div className="layout-preview masonry-preview">
                <div></div><div></div><div></div><div></div>
              </div>
              <span>Masonry</span>
            </button>
            <button onClick={() => handleLayoutChange('split-screen')} className={layout === 'split-screen' ? 'active' : ''}>
              <div className="layout-preview split-screen-preview">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <span>Split Screen</span>
            </button>
            <button onClick={() => handleLayoutChange('slideshow')} className={layout === 'slideshow' ? 'active' : ''}>
              <div className="layout-preview slideshow-preview">
                <div className="main"></div>
                <div className="thumbs"></div>
              </div>
              <span>Slideshow</span>
            </button>
            <button onClick={() => handleLayoutChange('circle')} className={layout === 'circle' ? 'active' : ''}>
              <div className="layout-preview circle-preview">
                <div></div><div></div><div></div>
                <div></div><div></div><div></div>
                <div></div><div></div><div></div>
              </div>
              <span>Circle</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoGallery;
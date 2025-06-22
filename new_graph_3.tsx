import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface ConversationPoint {
  x: number;
  y: number;
  z: number;
  email: string;
  title: string;
  timestamp: string;
  cluster_id: number;
  cluster_title: string;
}

interface APIResponse {
  data: ConversationPoint[];
  cluster_info: Record<string, any>;
  stats: {
    total_conversations: number;
    unique_users: number;
    unique_clusters: number;
    date_range: {
      min: string;
      max: string;
    };
  };
  last_updated: string;
}

interface SphericalCoordinates {
  radius: number;
  theta: number;
  phi: number;
}

const Modern3DUMAP: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const sphericalRef = useRef<SphericalCoordinates>({
    radius: 25,
    theta: 0,
    phi: Math.PI / 4,
  });
  const animationIdRef = useRef<number | null>(null); // safer option
  const autoRotateRef = useRef<boolean>(true);
  const lastTimeRef = useRef<number>(0);
  
  // State
  const [data, setData] = useState<ConversationPoint[]>([]);
  const [apiData, setApiData] = useState<APIResponse | null>(null);
  const [userColors, setUserColors] = useState<Map<string, string>>(new Map());
  const [clusterColors, setClusterColors] = useState<Map<string, string>>(new Map());
  const [filteredIndices, setFilteredIndices] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState<boolean>(false);
  
  // Controls state
  const [pointSize, setPointSize] = useState<number>(1.2);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.3);
  const [glowIntensity, setGlowIntensity] = useState<number>(0.8);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [colorMode, setColorMode] = useState<'user' | 'cluster'>('user');
  
  // Interaction state
  const [selectedPoint, setSelectedPoint] = useState<ConversationPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ConversationPoint | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);

  // API Configuration
  const API_BASE_URL = 'http://localhost:8000/api';

  // Color palettes
  const userColorPalette = [
    '#00d9ff', '#ff0080', '#00ff88', '#ff8800', 
    '#8800ff', '#ff4444', '#44ff44', '#4444ff',
    '#ffff44', '#ff44ff', '#44ffff', '#ffffff'
  ];

  const clusterColorPalette = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
    '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f',
    '#bb8fce', '#85c1e9', '#f8c471', '#82e0aa'
  ];

  // Fetch data from API
  const fetchDataFromAPI = useCallback(async (): Promise<ConversationPoint[]> => {
    try {
      setApiError(null);
      
      // First check if API is healthy
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      if (!healthResponse.ok) {
        throw new Error('API server is not healthy');
      }
      
      // Fetch the actual data
      const response = await fetch(`${API_BASE_URL}/data`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiResponse: APIResponse = await response.json();
      setApiData(apiResponse);
      setIsUsingMockData(false);
      
      console.log('API Data loaded:', apiResponse.stats);
      return apiResponse.data;
      
    } catch (error) {
      console.error('API fetch error:', error);
      setApiError(error instanceof Error ? error.message : 'Unknown API error');
      setIsUsingMockData(true);
      
      // Fallback to mock data
      return generateSampleData();
    }
  }, []);

  // Generate sample data (fallback)
  const generateSampleData = useCallback((): ConversationPoint[] => {
    const sampleEmails = [
      'alice@company.com', 'bob@startup.io', 'charlie@tech.org',
      'diana@research.edu', 'eve@design.co', 'frank@dev.net'
    ];
    
    const sampleTitles = [
      'Project Planning Discussion', 'Feature Implementation Review',
      'Bug Fix Strategy', 'User Experience Feedback', 'Performance Analysis',
      'Security Implementation', 'Database Optimization', 'API Design'
    ];

    const clusterTitles = [
      'Development & Coding', 'Project Management', 'Design & UX',
      'Security & Performance', 'Business Strategy', 'Technical Support'
    ];
    
    const generatedData: ConversationPoint[] = [];
    
    for (let i = 0; i < 150; i++) {
      const clusterCenter = {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20
      };
      
      const email = sampleEmails[Math.floor(Math.random() * sampleEmails.length)];
      const clusterId = Math.floor(Math.random() * clusterTitles.length);
      
      for (let j = 0; j < Math.random() * 5 + 2; j++) {
        generatedData.push({
          x: clusterCenter.x + (Math.random() - 0.5) * 6,
          y: clusterCenter.y + (Math.random() - 0.5) * 6,
          z: clusterCenter.z + (Math.random() - 0.5) * 6,
          email: email,
          title: sampleTitles[Math.floor(Math.random() * sampleTitles.length)],
          timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          cluster_id: clusterId,
          cluster_title: clusterTitles[clusterId]
        });
      }
    }
    
    return generatedData;
  }, []);

  // Assign colors to users
  const assignColors = useCallback((data: ConversationPoint[], mode: 'user' | 'cluster'): Map<string, string> => {
    const colors = new Map<string, string>();
    const palette = mode === 'user' ? userColorPalette : clusterColorPalette;
    
    if (mode === 'user') {
      const uniqueEmails = [...new Set(data.map(d => d.email))];
      uniqueEmails.forEach((email, index) => {
        colors.set(email, palette[index % palette.length]);
      });
    } else {
      const uniqueClusters = [...new Set(data.map(d => d.cluster_title))];
      uniqueClusters.forEach((cluster, index) => {
        colors.set(cluster, palette[index % palette.length]);
      });
    }
    
    return colors;
  }, [userColorPalette, clusterColorPalette]);

  // Update camera position using spherical coordinates
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    
    const { radius, theta, phi } = sphericalRef.current;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!canvasRef.current) return;

    const container = canvasRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 50, 200);
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(25, 15, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
  }, []);

  // Create 3D visualization
  const createVisualization = useCallback((data: ConversationPoint[]) => {
    if (!sceneRef.current) return;

    // Remove existing points
    if (pointsRef.current) {
      sceneRef.current.remove(pointsRef.current);
    }

    // Create geometry and materials
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(data.length * 3);
    const colors = new Float32Array(data.length * 3);
    const sizes = new Float32Array(data.length);
    
    // Get current color mapping
    const colorMap = colorMode === 'user' ? userColors : clusterColors;
    
    data.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      
      const colorKey = colorMode === 'user' ? point.email : point.cluster_title;
      const colorValue = colorMap.get(colorKey) || '#ffffff';
      const color = new THREE.Color(colorValue);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      sizes[i] = Math.random() * 0.5 + 0.8;
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create shader material for glowing points
    const material = new THREE.ShaderMaterial({
      uniforms: {
        pointSize: { value: pointSize },
        glowIntensity: { value: glowIntensity }
      },
      vertexShader: `
        attribute float size;
        uniform float pointSize;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pointSize * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float glowIntensity;
        varying vec3 vColor;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
          float glow = 1.0 - smoothstep(0.0, 0.3, distance);
          
          vec3 finalColor = vColor + (vColor * glow * glowIntensity);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });
    
    const points = new THREE.Points(geometry, material);
    sceneRef.current.add(points);
    pointsRef.current = points;
    
    // Initialize filtered indices (all visible)
    setFilteredIndices(new Set(Array.from(Array(data.length).keys())));
  }, [pointSize, glowIntensity, colorMode, userColors, clusterColors]);

  // Filter data based on search term
  const filterData = useCallback((searchTerm: string, data: ConversationPoint[]) => {
    if (!searchTerm) {
      setFilteredIndices(new Set(Array.from(Array(data.length).keys())));
    } else {
      const filtered = new Set<number>();
      const term = searchTerm.toLowerCase();
      
      data.forEach((point, index) => {
        if (point.title.toLowerCase().includes(term) || 
            point.email.toLowerCase().includes(term) ||
            point.cluster_title.toLowerCase().includes(term)) {
          filtered.add(index);
        }
      });
      
      setFilteredIndices(filtered);
    }
  }, []);

  // Update point visibility
  const updateVisibility = useCallback(() => {
    if (!pointsRef.current) return;
    
    const geometry = pointsRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    
    data.forEach((point, index) => {
      const visible = filteredIndices.has(index);
      
      if (!visible) {
        positions[index * 3] = 1000; // Move far away
        positions[index * 3 + 1] = 1000;
        positions[index * 3 + 2] = 1000;
      } else {
        positions[index * 3] = point.x;
        positions[index * 3 + 1] = point.y;
        positions[index * 3 + 2] = point.z;
      }
    });
    
    geometry.attributes.position.needsUpdate = true;
  }, [data, filteredIndices]);

  // Mouse event handlers
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!rendererRef.current || !cameraRef.current || !pointsRef.current) return;

    const rect = rendererRef.current.domElement.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObject(pointsRef.current);
    
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const index = intersection.index!;
      
      if (filteredIndices.has(index)) {
        setHoveredPoint(data[index]);
        setMousePosition({ x: event.clientX, y: event.clientY });
        setTooltipVisible(true);
      } else {
        setHoveredPoint(null);
        setTooltipVisible(false);
      }
    } else {
      setHoveredPoint(null);
      setTooltipVisible(false);
    }
  }, [data, filteredIndices]);

  const handleMouseClick = useCallback(() => {
    if (hoveredPoint) {
      setSelectedPoint(hoveredPoint);
    }
  }, [hoveredPoint]);

  // Setup mouse controls
  const setupControls = useCallback(() => {
    if (!rendererRef.current) return;

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      autoRotateRef.current = false;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMoveCanvas = (e: MouseEvent) => {
      if (isDragging) {
        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y
        };
        
        sphericalRef.current.theta -= deltaMove.x * 0.01;
        sphericalRef.current.phi += deltaMove.y * 0.01;
        
        sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalRef.current.phi));
        
        updateCameraPosition();
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      setTimeout(() => { autoRotateRef.current = true; }, 2000);
    };

    const handleWheel = (e: WheelEvent) => {
      const zoomSpeed = 0.1;
      const zoomFactor = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
      
      sphericalRef.current.radius *= zoomFactor;
      sphericalRef.current.radius = Math.max(8, Math.min(80, sphericalRef.current.radius));
      
      updateCameraPosition();
      e.preventDefault();
    };

    const canvas = rendererRef.current.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMoveCanvas);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMoveCanvas);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [updateCameraPosition]);

  // Fixed animation loop with proper rotation speed control
  const animate = useCallback(() => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // Auto rotation with proper timing
    if (autoRotateRef.current && rotationSpeed > 0) {
      // Use deltaTime for frame-rate independent rotation
      const rotationIncrement = (rotationSpeed * deltaTime) / 1000;
      sphericalRef.current.theta += rotationIncrement;
      updateCameraPosition();
    }
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  }, [rotationSpeed, updateCameraPosition]);

  // Window resize handler
  const handleResize = useCallback(() => {
    if (!canvasRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const container = canvasRef.current;
    cameraRef.current.aspect = container.clientWidth / container.clientHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(container.clientWidth, container.clientHeight);
  }, []);

  // Force refresh data from API
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Fetch the refreshed data
        const newData = await fetchDataFromAPI();
        setData(newData);
        
        // Update color mappings
        const newUserColors = assignColors(newData, 'user');
        const newClusterColors = assignColors(newData, 'cluster');
        setUserColors(newUserColors);
        setClusterColors(newClusterColors);
        
        // Recreate visualization
        createVisualization(newData);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      setApiError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchDataFromAPI, assignColors, createVisualization]);

  // Update shader uniforms when controls change
  useEffect(() => {
    if (pointsRef.current?.material) {
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.pointSize.value = pointSize;
    }
  }, [pointSize]);

  useEffect(() => {
    if (pointsRef.current?.material) {
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      material.uniforms.glowIntensity.value = glowIntensity;
    }
  }, [glowIntensity]);

  // Update visualization when color mode changes
  useEffect(() => {
    if (data.length > 0) {
      createVisualization(data);
    }
  }, [colorMode, createVisualization, data]);

  // Filter data when search term changes
  useEffect(() => {
    filterData(searchTerm, data);
  }, [searchTerm, data, filterData]);

  // Update visibility when filtered indices change
  useEffect(() => {
    updateVisibility();
  }, [filteredIndices, updateVisibility]);

  // Initialize everything
  useEffect(() => {
    const initializeVisualization = async () => {
      setIsLoading(true);
      
      // Initialize Three.js scene
      initScene();
      
      // Fetch data (with fallback to mock data)
      const fetchedData = await fetchDataFromAPI();
      setData(fetchedData);
      
      // Assign colors
      const newUserColors = assignColors(fetchedData, 'user');
      const newClusterColors = assignColors(fetchedData, 'cluster');
      setUserColors(newUserColors);
      setClusterColors(newClusterColors);
      
      // Create visualization
      setTimeout(() => {
        createVisualization(fetchedData);
        setIsLoading(false);
      }, 100);
      
      // Setup controls and animation
      const cleanupControls = setupControls();
      lastTimeRef.current = performance.now();
      animate();

      window.addEventListener('resize', handleResize);

      return () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
        window.removeEventListener('resize', handleResize);
        if (cleanupControls) cleanupControls();
        
        if (rendererRef.current && canvasRef.current) {
          canvasRef.current.removeChild(rendererRef.current.domElement);
          rendererRef.current.dispose();
        }
      };
    };

    initializeVisualization();
  }, []);

  // Calculate stats
  const totalUsers = userColors.size;
  const totalClusters = clusterColors.size;
  const visiblePoints = filteredIndices.size;

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      background: '#000000',
      fontFamily: "'Inter', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        .ui-panel {
          position: absolute;
          background: rgba(15, 15, 15, 0.8);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          transition: all 0.3s ease;
          pointer-events: auto;
        }
        
        .ui-panel:hover {
          background: rgba(20, 20, 20, 0.9);
          border-color: rgba(255, 255, 255, 0.15);
        }
        
        .control-panel {
          top: 20px;
          left: 20px;
          width: 260px;
          opacity: 0.85;
        }
        
        .search-panel {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 320px;
          opacity: 0.9;
        }
        
        .info-panel {
          top: 20px;
          right: 20px;
          width: 280px;
          opacity: 0;
          transform: translateX(20px);
          transition: all 0.3s ease;
        }
        
        .info-panel.visible {
          opacity: 1;
          transform: translateX(0);
        }
        
        .legend-panel {
          bottom: 20px;
          left: 20px;
          max-width: 220px;
          max-height: 160px;
          overflow-y: auto;
          opacity: 0.85;
        }
        
        .status-panel {
          bottom: 20px;
          right: 20px;
          width: 240px;
          opacity: 0.85;
        }
        
        h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .control-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #a0a0a0;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        input[type="range"] {
          width: 100%;
          height: 4px;
          background: #333;
          border-radius: 2px;
          outline: none;
          -webkit-appearance: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: linear-gradient(45deg, #00d9ff, #0099cc);
          border-radius: 50%;
          cursor: pointer;
        }
        
        input[type="text"] {
          width: 100%;
          padding: 12px 16px;
          background: rgba(40, 40, 40, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          transition: all 0.3s ease;
        }
        
        input[type="text"]:focus {
          border-color: #00d9ff;
          background: rgba(50, 50, 50, 0.9);
        }
        
        select {
          width: 100%;
          padding: 8px 12px;
          background: rgba(40, 40, 40, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #ffffff;
          font-size: 12px;
          outline: none;
          cursor: pointer;
        }
        
        button {
          width: 100%;
          padding: 8px 12px;
          background: linear-gradient(45deg, #00d9ff, #0099cc);
          border: none;
          border-radius: 6px;
          color: #ffffff;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        button:hover {
          background: linear-gradient(45deg, #0099cc, #006699);
          transform: translateY(-1px);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 12px;
          color: #e0e0e0;
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
        }
        
        .tooltip {
          position: absolute;
          background: rgba(10, 10, 10, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 12px;
          font-size: 12px;
          pointer-events: none;
          z-index: 1000;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          opacity: 0;
          transition: opacity 0.2s ease;
          max-width: 300px;
        }
        
        .tooltip.visible {
          opacity: 1;
        }
        
        .tooltip-title {
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
        }
        
        .tooltip-cluster {
          color: #00d9ff;
          font-size: 11px;
          margin-bottom: 2px;
        }
        
        .tooltip-email {
          color: #a0a0a0;
          font-size: 11px;
          margin-bottom: 2px;
        }
        
        .tooltip-date {
          color: #a0a0a0;
          font-size: 10px;
        }
        
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 1000;
          color: #ffffff;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top: 3px solid #00d9ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .stats {
          font-size: 11px;
          color: #a0a0a0;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .stats-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        
        .status-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .status-connected {
          background: #00ff88;
          box-shadow: 0 0 8px #00ff88;
        }
        
        .status-error {
          background: #ff4444;
          box-shadow: 0 0 8px #ff4444;
        }
        
        .status-mock {
          background: #ffaa00;
          box-shadow: 0 0 8px #ffaa00;
        }
      `}</style>

      <div 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%' }}
        onMouseMove={handleMouseMove}
        onClick={handleMouseClick}
      />
      
      {isLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <div style={{ fontWeight: 500 }}>
            {isUsingMockData ? 'Loading Sample Data...' : 'Processing Real Conversation Data...'}
          </div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#a0a0a0' }}>
            {isUsingMockData ? 'Using mock data for demonstration' : 'Fetching from API and generating 3D space'}
          </div>
        </div>
      )}
      
      {/* Control Panel */}
      <div className="ui-panel control-panel">
        <h3>🎛️ Controls</h3>
        
        <div className="control-group">
          <label>Color Mode</label>
          <select
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value as 'user' | 'cluster')}
          >
            <option value="user">By User</option>
            <option value="cluster">By Cluster</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Point Size</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={pointSize}
            onChange={(e) => setPointSize(parseFloat(e.target.value))}
          />
        </div>
        
        <div className="control-group">
          <label>Rotation Speed</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={rotationSpeed}
            onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
          />
        </div>
        
        <div className="control-group">
          <label>Glow Intensity</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={glowIntensity}
            onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
          />
        </div>
        
        {!isUsingMockData && (
          <div className="control-group">
            <button onClick={refreshData} disabled={isLoading}>
              🔄 Refresh Data
            </button>
          </div>
        )}
        
        <div className="stats">
          <div className="stats-item">
            <span>Total Points:</span>
            <span>{data.length}</span>
          </div>
          <div className="stats-item">
            <span>Users:</span>
            <span>{totalUsers}</span>
          </div>
          <div className="stats-item">
            <span>Clusters:</span>
            <span>{totalClusters}</span>
          </div>
          <div className="stats-item">
            <span>Visible:</span>
            <span>{visiblePoints}</span>
          </div>
        </div>
      </div>
      
      {/* Search Panel */}
      <div className="ui-panel search-panel">
        <h3>🔍 Search & Filter</h3>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search conversations, emails, or clusters..."
        />
      </div>
      
      {/* Info Panel */}
      <div className={`ui-panel info-panel ${selectedPoint ? 'visible' : ''}`}>
        <h3>💬 Conversation Details</h3>
        <div>
          {selectedPoint ? (
            <>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  {selectedPoint.title}
                </div>
                <div style={{ 
                  color: '#00d9ff', 
                  fontSize: '12px', 
                  marginBottom: '4px' 
                }}>
                  📁 {selectedPoint.cluster_title}
                </div>
                <div style={{ 
                  color: userColors.get(selectedPoint.email) || '#ffffff', 
                  fontSize: '12px', 
                  marginBottom: '8px' 
                }}>
                  👤 {selectedPoint.email}
                </div>
                <div style={{ color: '#a0a0a0', fontSize: '11px' }}>
                  📅 {new Date(selectedPoint.timestamp).toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#e0e0e0', lineHeight: 1.4 }}>
                This conversation is positioned in 3D space based on its semantic similarity to other conversations. 
                Points closer together represent more similar topics or themes.
              </div>
            </>
          ) : (
            <div style={{ color: '#a0a0a0', fontStyle: 'italic' }}>
              Click on a point to see details
            </div>
          )}
        </div>
      </div>
      
      {/* Legend Panel */}
      <div className="ui-panel legend-panel">
        <h3>{colorMode === 'user' ? '👤 Users' : '📁 Clusters'}</h3>
        <div>
          {Array.from((colorMode === 'user' ? userColors : clusterColors).entries()).map(([key, color]) => {
            const displayName = key.length > 25 ? key.substring(0, 22) + '...' : key;
            return (
              <div key={key} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ 
                    backgroundColor: color, 
                    boxShadow: `0 0 8px ${color}40` 
                  }}
                />
                <span>{displayName}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Status Panel */}
      <div className="ui-panel status-panel">
        <h3>📊 Status</h3>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
            <div className={`status-indicator ${isUsingMockData ? 'status-mock' : (apiError ? 'status-error' : 'status-connected')}`} />
            <span>
              {isUsingMockData ? 'Mock Data' : (apiError ? 'API Error' : 'Connected')}
            </span>
          </div>
          {apiError && (
            <div style={{ fontSize: '11px', color: '#ff6b6b', marginBottom: '8px' }}>
              {apiError}
            </div>
          )}
          {apiData && (
            <div style={{ fontSize: '11px', color: '#a0a0a0' }}>
              Last updated: {new Date(apiData.last_updated).toLocaleTimeString()}
            </div>
          )}
        </div>
        
        {apiData && (
          <div className="stats">
            <div className="stats-item">
              <span>API Total:</span>
              <span>{apiData.stats.total_conversations}</span>
            </div>
            <div className="stats-item">
              <span>API Users:</span>
              <span>{apiData.stats.unique_users}</span>
            </div>
            <div className="stats-item">
              <span>AI Clusters:</span>
              <span>{apiData.stats.unique_clusters}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      <div 
        className={`tooltip ${tooltipVisible ? 'visible' : ''}`}
        style={{ 
          left: mousePosition.x + 10, 
          top: mousePosition.y - 10 
        }}
      >
        {hoveredPoint && (
          <>
            <div className="tooltip-title">{hoveredPoint.title}</div>
            <div className="tooltip-cluster">📁 {hoveredPoint.cluster_title}</div>
            <div className="tooltip-email">👤 {hoveredPoint.email}</div>
            <div className="tooltip-date">📅 {new Date(hoveredPoint.timestamp).toLocaleDateString()}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default Modern3DUMAP;
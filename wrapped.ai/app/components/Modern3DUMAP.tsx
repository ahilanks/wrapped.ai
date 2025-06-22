import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface ConversationPoint {
  x: number;
  y: number;
  z: number;
  email: string;
  title: string;
  timestamp: string;
  cluster?: number;
  cluster_title?: string;
  body?: string;
}

interface SphericalCoordinates {
  radius: number;
  theta: number;
  phi: number;
}

interface APIResponse {
  data: ConversationPoint[];
  cluster_info: any;
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

const Modern3DUMAP: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const sphericalRef = useRef<SphericalCoordinates>({
    radius: 15,
    theta: 0,
    phi: Math.PI / 4,
  });
  const animationIdRef = useRef<number>();
  const autoRotateRef = useRef<boolean>(true);
  
  // State
  const [data, setData] = useState<ConversationPoint[]>([]);
  const [userColors, setUserColors] = useState<Map<string, string>>(new Map());
  const [filteredIndices, setFilteredIndices] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  // Controls state
  const [pointSize, setPointSize] = useState<number>(1.2);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.3);
  const [glowIntensity, setGlowIntensity] = useState<number>(0.8);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Interaction state
  const [selectedPoint, setSelectedPoint] = useState<ConversationPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ConversationPoint | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [uniqueClusters, setUniqueClusters] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  
  // Comparison mode state
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);
  const [comparisonUser, setComparisonUser] = useState<ConversationPoint | null>(null);
  const [sharedConnections, setSharedConnections] = useState<any[]>([]);
  const connectionLinesRef = useRef<THREE.Group | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Color palette
  const colorPalette = [
    '#00d9ff', '#ff0080', '#00ff88', '#ff8800', 
    '#8800ff', '#ff4444', '#44ff44', '#4444ff',
    '#ffff44', '#ff44ff', '#44ffff', '#ffffff'
  ];

  // Fetch data from Flask API
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const apiData: APIResponse = await response.json();
      
      setData(apiData.data);
      setStats(apiData.stats);
      
      const uniqueClusterTitles = [...new Set(apiData.data.map(p => p.cluster_title).filter(Boolean) as string[])];
      setUniqueClusters(uniqueClusterTitles.sort());
      
      const uniqueUsers = [...new Set(apiData.data.map(d => d.email))].sort();
      setAllUsers(uniqueUsers);
      if (uniqueUsers.length > 0 && !currentUserEmail) {
        setCurrentUserEmail(uniqueUsers[0]);
      }
      
      // Assign colors to users
      const colors = assignColors(apiData.data);
      setUserColors(colors);
      
      // Initialize filtered indices (all visible)
      setFilteredIndices(new Set(Array.from(Array(apiData.data.length).keys())));
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      const response = await fetch('/api/refresh', { method: 'POST' });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, [fetchData]);

  // Assign colors to users
  const assignColors = useCallback((data: ConversationPoint[]): Map<string, string> => {
    const uniqueEmails = [...new Set(data.map(d => d.email))];
    const colors = new Map<string, string>();
    
    uniqueEmails.forEach((email, index) => {
      colors.set(email, colorPalette[index % colorPalette.length]);
    });
    
    return colors;
  }, [colorPalette]);

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
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.001,
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
  const createVisualization = useCallback((data: ConversationPoint[], userColors: Map<string, string>) => {
    if (!sceneRef.current || data.length === 0) return;

    // Remove existing points
    if (pointsRef.current) {
      sceneRef.current.remove(pointsRef.current);
    }

    // Create geometry and materials
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(data.length * 3);
    const colors = new Float32Array(data.length * 3);
    const sizes = new Float32Array(data.length);
    
    data.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      
      const baseColor = new THREE.Color(userColors.get(point.email) || '#ffffff');
      
      if (point.cluster !== undefined && point.cluster !== null) {
        const color = baseColor.clone();
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);
        const lightnessShift = ((point.cluster % 5) - 2) * 0.1;
        color.setHSL(hsl.h, hsl.s, Math.max(0.2, Math.min(0.9, hsl.l + lightnessShift)));
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      } else {
        colors[i * 3] = baseColor.r;
        colors[i * 3 + 1] = baseColor.g;
        colors[i * 3 + 2] = baseColor.b;
      }
      
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
          float dist = length(gl_PointCoord - vec2(0.5));

          // A soft glow that covers the whole point and fades outwards
          float glow = pow(1.0 - smoothstep(0.2, 0.5, dist), 2.0) * glowIntensity;
          
          // The solid core of the circle, with a sharp edge
          float core = 1.0 - smoothstep(0.47, 0.48, dist);

          // A thin, bright border around the core for contrast
          float border = smoothstep(0.47, 0.48, dist) - smoothstep(0.49, 0.5, dist);
          
          // Combine the components. Alpha controls brightness with additive blending.
          // The border is made much brighter than the core to create a sharp edge.
          float final_alpha = core * 0.4 + border * 1.0 + glow;
          
          gl_FragColor = vec4(vColor, final_alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const points = new THREE.Points(geometry, material);
    sceneRef.current.add(points);
    pointsRef.current = points;
  }, [pointSize, glowIntensity]);

  // This useEffect replaces the old filterData and updateVisibility logic
  useEffect(() => {
    if (!pointsRef.current || !data || data.length === 0) return;
    
    const geometry = pointsRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const term = searchTerm.toLowerCase();

    const newFilteredIndices = new Set<number>();
    
    data.forEach((point, index) => {
      const searchMatch = !term || 
          point.title.toLowerCase().includes(term) || 
          point.email.toLowerCase().includes(term) ||
          (point.cluster_title && point.cluster_title.toLowerCase().includes(term)) ||
          (point.body && point.body.toLowerCase().includes(term));
      
      const clusterMatch = selectedCluster === 'all' || point.cluster_title === selectedCluster;
      const comparisonMatch = !comparisonMode || point.email === currentUserEmail || point.email === comparisonUser?.email;

      const isVisible = searchMatch && clusterMatch && comparisonMatch;

      if (isVisible) {
        newFilteredIndices.add(index);
        positions[index * 3] = point.x;
        positions[index * 3 + 1] = point.y;
        positions[index * 3 + 2] = point.z;
      } else {
        // Move points far away to hide them, using a large number
        positions[index * 3] = 10000;
        positions[index * 3 + 1] = 10000;
        positions[index * 3 + 2] = 10000;
      }
    });
    
    setFilteredIndices(newFilteredIndices);
    geometry.attributes.position.needsUpdate = true;
  }, [data, searchTerm, selectedCluster, pointSize, userColors, comparisonMode, comparisonUser, currentUserEmail]);

  // Mouse event handlers
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!rendererRef.current || !cameraRef.current || !pointsRef.current || !filteredIndices) return;

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
      sphericalRef.current.radius = Math.max(0.001, Math.min(80, sphericalRef.current.radius));
      
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

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // Auto rotation
    if (autoRotateRef.current && rotationSpeed > 0) {
      sphericalRef.current.theta += rotationSpeed * 0.01;
      updateCameraPosition();
    }
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  }, [rotationSpeed, updateCameraPosition]);

  // Window resize handler
  const handleResize = useCallback(() => {
    if (!canvasRef.current || !cameraRef.current || !rendererRef.current) return;
    
    const container = canvasRef.current;
    if (container.clientWidth === 0 || container.clientHeight === 0) return;

    cameraRef.current.aspect = container.clientWidth / container.clientHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(container.clientWidth, container.clientHeight);
  }, []);

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

  // Create visualization when data changes
  useEffect(() => {
    if (data.length > 0 && userColors.size > 0) {
      createVisualization(data, userColors);
    }
  }, [data, userColors, createVisualization]);

  // Initialize scene and fetch data
  useEffect(() => {
    if (!canvasRef.current) return;

    initScene();
    fetchData();

    const cleanupControls = setupControls();
    animate();

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(canvasRef.current);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Ensure resize is called on fullscreen change
      setTimeout(handleResize, 50);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      resizeObserver.disconnect();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      if (cleanupControls) cleanupControls();
      
      if (rendererRef.current && canvasRef.current && rendererRef.current.domElement.parentElement === canvasRef.current) {
        canvasRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initScene, fetchData, setupControls, animate, handleResize]);

  // Calculate stats
  const totalUsers = userColors.size;
  const visiblePoints = filteredIndices.size;

  // Comparison mode logic
  const enterComparisonMode = useCallback(async (targetUser: ConversationPoint) => {
    if (!currentUserEmail) {
      alert("Current user not set.");
      return;
    }
    
    setComparisonUser(targetUser);
    setIsLoading(true);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email1: currentUserEmail, email2: targetUser.email })
      });
      const connections = await response.json();
      setSharedConnections(connections);
      setComparisonMode(true);
    } catch (err) {
      console.error("Failed to fetch comparison:", err);
      setError("Could not load shared connections.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserEmail]);

  const exitComparisonMode = () => {
    setComparisonMode(false);
    setComparisonUser(null);
    setSharedConnections([]);
  };

  // Draw connection lines
  useEffect(() => {
    if (!sceneRef.current) return;

    if (connectionLinesRef.current) {
      sceneRef.current.remove(connectionLinesRef.current);
      connectionLinesRef.current.clear();
    }

    if (comparisonMode && sharedConnections.length > 0) {
      const lineGroup = new THREE.Group();
      
      sharedConnections.forEach(conn => {
        const p1 = conn.conversation1;
        const p2 = conn.conversation2;
        
        const points = [
          new THREE.Vector3(p1.x, p1.y, p1.z),
          new THREE.Vector3(p2.x, p2.y, p2.z)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          linewidth: 1,
          transparent: true,
          opacity: 0.5 + (conn.similarity - 0.7) // Opacity based on similarity
        });
        
        const line = new THREE.Line(geometry, material);
        lineGroup.add(line);
      });
      
      sceneRef.current.add(lineGroup);
      connectionLinesRef.current = lineGroup;
    }
  }, [comparisonMode, sharedConnections]);

  const toggleFullscreen = useCallback(() => {
    if (!mainContainerRef.current) return;

    if (!document.fullscreenElement) {
      mainContainerRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={mainContainerRef}
      style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
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
          width: 240px;
          opacity: 0.85;
        }
        
        .search-panel {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 360px;
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
        
        .error-panel {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          background: rgba(40, 20, 20, 0.9);
          border-color: rgba(255, 100, 100, 0.3);
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
          box-sizing: border-box;
        }
        
        input[type="text"]:focus {
          border-color: #00d9ff;
          background: rgba(50, 50, 50, 0.9);
        }
        
        .refresh-btn {
          background: linear-gradient(45deg, #00d9ff, #0099cc);
          border: none;
          border-radius: 6px;
          color: white;
          padding: 8px 12px;
          font-size: 12px;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.3s ease;
        }
        
        .refresh-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 217, 255, 0.3);
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
        }
        
        .tooltip.visible {
          opacity: 1;
        }
        
        .tooltip-title {
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
        }
        
        .tooltip-email {
          color: #00d9ff;
          font-size: 11px;
          margin-bottom: 2px;
        }
        
        .tooltip-date {
          color: #a0a0a0;
          font-size: 10px;
        }
        
        .tooltip-cluster {
          color: #ffaa00;
          font-size: 11px;
          margin-bottom: 2px;
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
        
        .error-message {
          color: #ff6b6b;
          font-size: 14px;
          text-align: center;
        }
        
        .comparison-panel {
          bottom: 20px;
          left: 20px;
          right: 20px;
          max-height: 35vh;
          display: flex;
          flex-direction: column;
        }

        .comparison-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-shrink: 0;
        }
        
        .comparison-panel-header h3 {
          margin-bottom: 0;
        }

        .comparison-content {
          display: flex;
          flex-wrap: nowrap;
          gap: 16px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 8px 0;
        }
        .comparison-content::-webkit-scrollbar {
          height: 8px;
        }
        .comparison-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .comparison-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .comparison-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .comparison-item {
          background: rgba(40, 40, 40, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          width: 300px;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .comparison-item:hover {
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        
        .dropdown-select {
          width: 100%;
          padding: 10px 12px;
          background: rgba(40, 40, 40, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 13px;
          outline: none;
          transition: all 0.3s ease;
          -webkit-appearance: none;
          appearance: none;
          background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23999%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E');
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 12px;
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
          <div style={{ fontWeight: 500 }}>Loading Real Data...</div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#a0a0a0' }}>
            Fetching conversations and generating 3D visualization
          </div>
        </div>
      )}
      
      {error && (
        <div className="ui-panel error-panel">
          <h3>Error</h3>
          <div className="error-message">{error}</div>
          <button className="refresh-btn" onClick={fetchData}>
            Retry
          </button>
        </div>
      )}
      
      {/* Control Panel */}
      <div className="ui-panel control-panel">
        <h3>Controls</h3>
        
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
        
        <div className="control-group">
          <label>Filter by Cluster</label>
          <select
            value={selectedCluster}
            onChange={(e) => setSelectedCluster(e.target.value)}
            className="dropdown-select"
          >
            <option value="all">All Clusters</option>
            {uniqueClusters.map(cluster => (
              <option key={cluster} value={cluster}>{cluster}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Email</label>
          <select
            value={currentUserEmail || ''}
            onChange={(e) => setCurrentUserEmail(e.target.value)}
            className="dropdown-select"
          >
            {allUsers.map(email => (
              <option key={email} value={email}>{email}</option>
            ))}
          </select>
        </div>
        
        <button className="refresh-btn" onClick={toggleFullscreen} style={{width: '100%', marginTop: '16px'}}>
          {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        </button>
        
        <button className="refresh-btn" onClick={refreshData}>
          Refresh Data
        </button>
        
        <div className="stats">
          <div className="stats-item">
            <span>Total Points:</span>
            <span>{stats?.total_conversations || data.length}</span>
          </div>
          <div className="stats-item">
            <span>Users:</span>
            <span>{stats?.unique_users || totalUsers}</span>
          </div>
          <div className="stats-item">
            <span>Visible:</span>
            <span>{visiblePoints}</span>
          </div>
          {stats?.unique_clusters && (
            <div className="stats-item">
              <span>Clusters:</span>
              <span>{stats.unique_clusters}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Search Panel */}
      <div className="ui-panel search-panel">
        <h3>Search & Filter</h3>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search conversations, emails, or clusters..."
        />
      </div>
      
      {/* Info Panel */}
      <div className={`ui-panel info-panel ${selectedPoint ? 'visible' : ''}`}>
        <h3>Conversation Details</h3>
        <div className="info-panel-content">
          {selectedPoint ? (
            <>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  {selectedPoint.title}
                </div>
                <div style={{ 
                  color: userColors.get(selectedPoint.email) || '#ffffff', 
                  fontSize: '12px', 
                  marginBottom: '8px' 
                }}>
                  {selectedPoint.email}
                </div>
                {selectedPoint.cluster_title && (
                  <div style={{ color: '#ffaa00', fontSize: '11px', marginBottom: '8px' }}>
                    Cluster: {selectedPoint.cluster_title}
                  </div>
                )}
                <div style={{ color: '#a0a0a0', fontSize: '11px' }}>
                  {new Date(selectedPoint.timestamp).toLocaleString()}
                </div>
              </div>
              {selectedPoint.body && (
                <div style={{
                  fontSize: '12px',
                  color: '#e0e0e0',
                  lineHeight: 1.4,
                  maxHeight: '120px',
                  overflowY: 'auto',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '8px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  whiteSpace: 'pre-wrap'
                }}>
                  <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                    Conversation Body
                  </div>
                  {selectedPoint.body}
                </div>
              )}
              {selectedPoint && selectedPoint.email !== currentUserEmail && (
                <button 
                  className="refresh-btn" 
                  style={{marginTop: '12px', width: '100%'}}
                  onClick={() => enterComparisonMode(selectedPoint)}
                >
                  Find Shared Connections
                </button>
              )}
              <div style={{ fontSize: '11px', color: '#e0e0e0', lineHeight: 1.4, marginTop: '12px' }}>
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
      <div className={`ui-panel legend-panel ${comparisonMode ? 'hidden' : ''}`}>
        <h3>Users</h3>
        <div>
          {Array.from(userColors.entries()).map(([email, color]) => {
            const shortEmail = email.length > 25 ? email.substring(0, 22) + '...' : email;
            return (
              <div key={email} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ 
                    backgroundColor: color, 
                    boxShadow: `0 0 8px ${color}40` 
                  }}
                />
                <span>{shortEmail}</span>
              </div>
            );
          })}
        </div>
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
            <div className="tooltip-email">{hoveredPoint.email}</div>
            {hoveredPoint.cluster_title && (
              <div className="tooltip-cluster">Cluster: {hoveredPoint.cluster_title}</div>
            )}
            <div className="tooltip-date">{new Date(hoveredPoint.timestamp).toLocaleDateString()}</div>
          </>
        )}
      </div>
      
      {/* Shared Connections Panel */}
      {comparisonMode && (
        <div className="ui-panel comparison-panel">
          <div className="comparison-panel-header">
            <div>
              <h3>Shared Connections</h3>
              <p style={{fontSize: '12px', color: '#a0a0a0', marginTop: '-4px', marginBottom: '0'}}>
                With {comparisonUser?.email}
              </p>
            </div>
            <button className="refresh-btn" style={{height: 'fit-content'}} onClick={exitComparisonMode}>
              Exit Comparison
            </button>
          </div>
          <div className="comparison-content">
            {sharedConnections.length > 0 ? (
              sharedConnections.map((conn, index) => (
                <div key={index} className="comparison-item">
                  <div style={{fontWeight: 600, color: '#fff', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.5px'}}>
                    ~{(conn.similarity * 100).toFixed(0)}% Match
                  </div>
                  <div style={{marginBottom: '12px'}}>
                    <span style={{opacity: 0.7, fontWeight: 400}}>You: </span>
                    <span style={{color: userColors.get(conn.conversation1.email) || '#fff', fontWeight: 300}}>
                      {conn.conversation1.title}
                    </span>
                  </div>
                  <div>
                    <span style={{opacity: 0.7, fontWeight: 400}}>Them: </span>
                    <span style={{color: userColors.get(conn.conversation2.email) || '#fff', fontWeight: 300}}>
                      {conn.conversation2.title}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{color: '#a0a0a0', fontSize: '12px', fontStyle: 'italic', textAlign: 'center', padding: '16px 0', width: '100%'}}>
                No strong connections found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Modern3DUMAP; 
//***************************************************************************************/
//
//  Loading and Displaying a 3D Model with React Three Fiber
//
//  Basic React app to load and display a 3D model with .hdr environment lighting. 
//
//  Ringo Cheung
// 
//  2026/6/7 - Basic HDR environment plus loading 3D model
//  2026/6/8 - Remove HDR background and model auto rotation effect, added point lights
//  2026/6/9 - Added raycast click to the model and toggle rotation effect on click
//  2026/6/11 - Fixed the bug of click event not working when clicked outside the model
//
//***************************************************************************************/

import { Canvas, useThree, useFrame, useLoader, extend } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Stats, OrbitControls, useTexture, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Importing the texture files for the model
import diffuse from './assets/images/metal_plate/textures/metal_plate_diffuse.jpg';
import arm from './assets/images/metal_plate/textures/metal_plate_arm.jpg';
import normal from './assets/images/metal_plate/textures/metal_plate_normal.jpg';

//import street from './assets/images/modern_evening_street_4k.hdr';

function LoadModel({ onModelClick, modelRotationSpeed, useNewTexture }) {
  const originalMaterials = useRef({});
  const modelCar = useRef();
  const gltf = useLoader( GLTFLoader, "/old_rusty_car/scene.gltf" );
  const { camera } = useThree();

  // Load the alternative texture files - Diffuse, ARM, and Normal JPG files
  const [diffuseMap, armMap, normalMap] = useTexture([
    diffuse,
    arm,
    normal
  ]);

  // Essential color space calibration for JPG formats
  diffuseMap.colorSpace = THREE.SRGBColorSpace // Ensures colors look rich, not washed out
  armMap.colorSpace = THREE.NoColorSpace       // Data maps must remain linear 
  normalMap.colorSpace = THREE.NoColorSpace     // Normal maps also require linear color space to function correctly

  useEffect(() => {
    // Store the original materials for later restoration
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        originalMaterials.current[child.name] = child.material.clone();
      }
    });
  }, [gltf.scene]);

  useEffect(() => {
    camera.position.set( 3, 3, 5 );
  }, [ camera]);

  // Find the first mesh in the loaded GLTF scene for raycasting
  const carMesh = useMemo(
    () => gltf.scene.getObjectByProperty('type', 'Mesh'),
    [gltf.scene]
  );

  useFrame(() => {
    if ( modelCar.current ) {
      modelCar.current.rotation.y += modelRotationSpeed;
    }
  });

  return (
    
      <primitive
        onPointerDown={ (e) => {
          if (e.object === carMesh) {

          // Traverse the model and plug in the ARM maps
            gltf.scene.traverse((child) => {
              console.log('child name:', child.name);
              if (child.isMesh && (child.name === 'Object006_Material_#294_0' || child.name === 'Object007_Material_#295_0')) {
                if (useNewTexture) {
                  child.material = new THREE.MeshPhysicalMaterial({
                    map: diffuseMap,
                    normalMap: normalMap,
                    
                    // Feed the same ARM texture into its respective channels
                    aoMap: armMap,
                    roughnessMap: armMap,
                    metalnessMap: armMap,

                    // Calibrate the strength multipliers (1.0 allows the map to dictate the surface)
                    aoMapIntensity: 1.0,
                    roughness: 1.0,
                    metalness: 1.0,

                    // The brand-new showroom finish layers
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.05,
                  })
                } else {
                  child.material = originalMaterials.current[child.name];
                }
              }
            })

            e.stopPropagation();
            onModelClick();
          } else {
            console.log('Clicked outside the model!');
          }
        }}
        ref={ modelCar }
        object={ gltf.scene }
        scale={ 0.04 }
        position={[ -20, -7, -10 ]}
      />
    
  );
};


function App() {
  const [ modelRotationSpeed, setModelRotationSpeed ] = useState( 0.001 );
  const [ useNewTexture, setUseNewTexture ] = useState( false );
  const handleModelClick = () => {
    setModelRotationSpeed( prevSpeed => prevSpeed === 0.001 ? 0 : 0.001 );
    setUseNewTexture( prevTexture => !prevTexture ); // Toggle the texture state on click
    setModelRotationSpeed( prevSpeed => prevSpeed === 0.001 ? 0 : 0.001 );
  };

  //const [ background, setBackground ] = useState( street );

  return (
    <>
      <Canvas>
        <color attach="background" args={ [ 0.5, 0.5, 0.5 ] } />
        <Suspense fallback={ null }>
          <ambientLight />
          <pointLight position={ [ 5, 5, 5 ] }  intensity={ 10 } />
          <pointLight position={ [ -5, 5, 5 ] }  intensity={ 10 } />
          <pointLight position={ [ -5, 0, 0 ] }  intensity={ 10 } />
          <pointLight position={ [ 5, 5, -5 ] }  intensity={ 10 } />
          <pointLight position={ [ -5, 5, -5 ] }  intensity={ 10 } />
          <Stats />
          <OrbitControls enableZoom={ false } enablePan={ false } />
          <LoadModel onModelClick={ handleModelClick } modelRotationSpeed={ modelRotationSpeed } useNewTexture={ useNewTexture } />
          <Environment preset="sunset" background={ true } />
        </Suspense>
      </Canvas>
    </>
  );
}

export default App;
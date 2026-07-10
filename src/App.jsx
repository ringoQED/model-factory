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
//  2026/7/10 - Added a control menu to select different materials for the model
//
//***************************************************************************************/

// REMARK : The applyMaterial function will pass the carMaterial state to the model and change 
// the material of the model accordingly. The carMaterial state is set by the control menu, 
// which allows the user to select different materials for the model. The useNewTexture state 
// is used to toggle between the original material and the new material when the model is clicked.
// But this useNewTexture state is not used in the applyMaterial function, so it is not necessary 
// to pass it as a prop to the LoadModel component. The applyMaterial function will only change 
// the material of the model based on the carMaterial state, which is set by the control menu.

import { Canvas, useThree, useFrame, useLoader, extend } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Stats, OrbitControls, useTexture, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

// Importing the texture files for the model
import diffuse from './assets/images/metal_plate/textures/metal_plate_diffuse.jpg';
import arm from './assets/images/metal_plate/textures/metal_plate_arm.jpg';
import normal from './assets/images/metal_plate/textures/metal_plate_normal.jpg';

function LoadModel({ onModelClick, modelRotationSpeed, useNewTexture, carMaterial }) {
  const originalMaterials = useRef({});
  const modelCar = useRef();
  const gltf = useLoader( GLTFLoader, "/old_rusty_car/scene.gltf" );
  const { camera } = useThree();

  const applyMaterial = (materialVariant) => {
    gltf.scene.traverse((child) => {
      if (!child.isMesh || !['Object006_Material_#294_0', 'Object007_Material_#295_0'].includes(child.name)) {
        return;
      }

      if (materialVariant === 'Shiny') {
        child.material = new THREE.MeshPhysicalMaterial({
          map: diffuseMap,
          normalMap: normalMap,
          aoMap: armMap,
          roughnessMap: armMap,
          metalnessMap: armMap,
          aoMapIntensity: 1.0,
          roughness: 1.0,
          metalness: 1.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
        });
      } else if (materialVariant === 'Woody') {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#7a4a2b'),
          roughness: 0.95,
          metalness: 0.05,
          clearcoat: 0.2,
          clearcoatRoughness: 0.8,
        });
      } else {
        child.material = originalMaterials.current[child.name] || child.material;
      }
    });
  };

  // Assign the loaded textures to their respective maps and set the appropriate color spaces
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
    applyMaterial(carMaterial);
  }, [carMaterial, diffuseMap, armMap, normalMap, gltf.scene]);

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
      /* Changing texture will be done in pull down menu, so no need to handle click event here
        onPointerDown={ (e) => {
          if (e.object === carMesh) {
            const nextUseNewTexture = !useNewTexture;
            applyMaterial(nextUseNewTexture ? 'Shiny' : carMaterial);

            e.stopPropagation();
            onModelClick(nextUseNewTexture);
          } else {
            console.log('Clicked outside the model!');
          }
        }}
        */
        ref={ modelCar }
        object={ gltf.scene }
        scale={ 0.04 }
        position={[ -20, -7, -10 ]}
      />
    
  );
};


// Control menu to select different restaurants as background
function CtrlMenu ({ setCarMaterial }) {

  useEffect(() => {

    const obj = {
      CarMaterial : 'Rusty',
    };
  
    const gui = new GUI();

    gui.add( obj, 'CarMaterial', ['Rusty', 'Shiny', 'Woody'] ).onFinishChange( value => {
    switch( value ) {
      case 'Rusty':
        setCarMaterial('Rusty');
        break;
      case 'Shiny':
        setCarMaterial('Shiny');
        break;
      case 'Woody':
        setCarMaterial('Woody');
        break;
    }
    console.log('Selected Car Material:', value);
  })
  
  return () => {
    gui.destroy()
  }
}, [setCarMaterial]);
}


function App() {
  const [ carMaterial, setCarMaterial ] = useState( 'Rusty' );
  const [ modelRotationSpeed, setModelRotationSpeed ] = useState( 0.001 );
  const [ useNewTexture, setUseNewTexture ] = useState( false );
  const handleModelClick = (nextUseNewTexture) => {
    // setModelRotationSpeed( prevSpeed => prevSpeed === 0.001 ? 0 : 0.001 );
    setUseNewTexture(nextUseNewTexture); // Toggle the texture state on click
    // setModelRotationSpeed( prevSpeed => prevSpeed === 0.001 ? 0 : 0.001 );
  };

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
          <CtrlMenu setCarMaterial={ setCarMaterial } />
          <LoadModel onModelClick={ handleModelClick } modelRotationSpeed={ modelRotationSpeed } useNewTexture={ useNewTexture } carMaterial={ carMaterial } />
          <Environment preset="sunset" background={ true } />
        </Suspense>
      </Canvas>
    </>
  );
}

export default App;
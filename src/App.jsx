//********************************************************************************/
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
//
//*********************************************************************************/

import { Canvas, useThree, useFrame, useLoader, extend } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { useRef, useEffect, useState, Suspense } from 'react';
import { Stats, OrbitControls, Environment } from '@react-three/drei';

//import street from './assets/images/modern_evening_street_4k.hdr';

function LoadModel({ onModelClick, modelRotationSpeed }) {
  const modelCar = useRef();
  const gltf = useLoader( GLTFLoader, "/old_rusty_car/scene.gltf" );
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set( 3, 3, 5 );
  }, [ camera]);

  useFrame(() => {
    if ( modelCar.current ) {
      modelCar.current.rotation.y += modelRotationSpeed;
    }
  });

  return (
    <primitive
      onPointerDown={ (e) => {
        e.stopPropagation();
        onModelClick();
      }}
      ref={ modelCar }
      object={ gltf.scene }
      scale={ 0.01 }
      position={[ 0, 0, 0 ]}
    />
  );
};


function App() {
  const [ modelRotationSpeed, setModelRotationSpeed ] = useState( 0.001 );
  const handleModelClick = () => {
    console.log('Model clicked!');
    setModelRotationSpeed( prevSpeed => prevSpeed === 0.001 ? 0 : 0.001 );
  };

  //const [ background, setBackground ] = useState( street );

  return (
    <>
      <Canvas >
        <color attach="background" args={ [ 0.5, 0.5, 0.5 ] } />
        <Suspense fallback={ null }>
          <ambientLight />
          <pointLight position={ [ 5, 5, 5 ] }  intensity={ 100 } />
          <pointLight position={ [ -5, 5, 5 ] }  intensity={ 100 } />
          <pointLight position={ [ -5, 0, 0 ] }  intensity={ 30 } />
          <pointLight position={ [ 5, 5, -5 ] }  intensity={ 30 } />
          <pointLight position={ [ -5, 5, -5 ] }  intensity={ 30 } />
          <Stats />
          <OrbitControls enableZoom={ false } enablePan={ false } />
          <LoadModel onModelClick={ handleModelClick } modelRotationSpeed={ modelRotationSpeed } />
        </Suspense>
      </Canvas>
    </>
  );
}

export default App;
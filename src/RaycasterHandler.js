//src/RaycasterHandler.js
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import React, { useRef } from 'react';

const RaycasterHandler = ({ onCellDoubleClick }) => {
  const { gl, camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const handlePointerMove = (event) => {
    mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  const handlePointerDown = (event) => {
    if (event.detail === 2) { // Detect double-click
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        const { face, cell } = intersect.object.userData;
        if (face !== undefined && cell !== undefined) {
          onCellDoubleClick(face, cell);
        }
      }
    }
  };

  useFrame(() => {
    raycaster.current.setFromCamera(mouse.current, camera);
  });

  React.useEffect(() => {
    gl.domElement.addEventListener('pointermove', handlePointerMove);
    gl.domElement.addEventListener('pointerdown', handlePointerDown);

    return () => {
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [gl.domElement]);

  return null;
};

export default RaycasterHandler;

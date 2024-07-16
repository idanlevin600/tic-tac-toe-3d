import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const useRaycaster = (handleCellClick) => {
  const { gl, camera, scene } = useThree();

  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerDown = (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.userData && object.userData.face !== undefined && object.userData.cell !== undefined) {
          handleCellClick(object.userData.face, object.userData.cell);
        }
      }
    };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [gl, camera, scene, handleCellClick]);
};

export default useRaycaster;

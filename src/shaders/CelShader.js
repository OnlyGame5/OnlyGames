import * as THREE from 'three';

/**
 * Creates a cel shading material for the doors
 * Provides cartoon-like shading with discrete color bands
 */
export function createCelShadingMaterial(baseColor = 0x2a2a2a, numShades = 3) {
  const color = new THREE.Color(baseColor);
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uNumShades: { value: numShades },
      uOutlineColor: { value: new THREE.Color(0x000000) },
      uOutlineWidth: { value: 0.01 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        
        vec4 worldPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -worldPosition.xyz;
        
        gl_Position = projectionMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uNumShades;
      uniform vec3 uOutlineColor;
      uniform float uOutlineWidth;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vViewPosition;
      
      void main() {
        // Calculate lighting
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        
        // Simple directional light
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
        
        // Calculate dot product for basic lighting
        float NdotL = max(dot(normal, lightDir), 0.0);
        
        // Cel shading - discrete color bands
        float cel = floor(NdotL * uNumShades) / uNumShades;
        cel = max(cel, 0.2); // Prevent pure black
        
        // Apply cel shading to color
        vec3 shadedColor = uColor * cel;
        
        // Optional outline effect (commented out by default)
        // float outline = step(dot(normal, viewDir), uOutlineWidth);
        // shadedColor = mix(shadedColor, uOutlineColor, outline * 0.5);
        
        gl_FragColor = vec4(shadedColor, 1.0);
      }
    `
  });
  
  return material;
}


import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="container-custom h-full flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="heading-primary mb-6">
              Hola, soy <span className="text-primary">[Tu Nombre]</span>
            </h1>
            <p className="text-xl text-secondary mb-8">
              Ingeniero del software & diseñador de interfaces
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary px-8 py-3 rounded-lg font-medium"
            >
              Conoce mi trabajo
            </motion.button>
          </motion.div>
        </div>
      </div>
      
      <div className="hero-background">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls enableZoom={false} />
            {/* Add your 3D model here */}
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
};

export default Hero; 